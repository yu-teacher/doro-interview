package com.doro.interview.api;

import com.doro.interview.account.CurrentUser;
import com.doro.interview.api.CatalogResponses.ConceptDetailResponse;
import com.doro.interview.api.CatalogResponses.SearchResponse;
import com.doro.interview.api.CatalogResponses.TopicResponse;
import com.doro.interview.catalog.CatalogReader;
import com.doro.interview.catalog.CatalogViews.QuestionSummary;
import com.doro.interview.catalog.CatalogViews.CategoryView;
import com.doro.interview.catalog.CatalogViews.ConceptView;
import com.doro.interview.catalog.SearchQuery;
import com.doro.interview.common.exception.ErrorCode;
import com.doro.interview.common.exception.InterviewException;
import com.doro.interview.common.response.ApiResponse;
import com.doro.interview.api.CatalogResponses.UserFlags;
import com.doro.interview.progress.read.ProgressReader;
import com.doro.interview.quiz.read.QuizStatsReader;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * 사전 읽기 API(로그인 없이 호출한다). 공개 주제·닫히지 않은 질문만 보이고, 그 밖의 것은 **없는 것과 똑같은 404** 로 답한다
 * (존재 여부를 드러내지 않는다). 성공 응답은 ETag 가 동작하도록 timestamp 가 없다({@link ApiResponse#cacheable}). 이 계층은 합성 계층이라, **로그인한 사용자의 응답에만** 질문마다 `learned` 를 합친다(비로그인 응답은 M1 과 바이트가 같다, docs/M2-PLAN.md D8). ETag 가 본문 해시이므로 합쳐진 본문이 곧 사용자별 ETag 이고, 사용자별 본문이라 `private` 로 표시한다.
 */
@RestController
@RequestMapping("/api/v1")
public class CatalogController {

    /** slug 형식이 아니면 조회하지 않고 바로 404 로 답한다. */
    private static final Pattern SLUG = Pattern.compile("[a-z0-9]+(-[a-z0-9]+)*");
    private static final int MAX_SLUG_LENGTH = 60;

    private final CatalogReader reader;
    private final CurrentUser currentUser;
    private final ProgressReader progress;
    private final QuizStatsReader quizStats;

    public CatalogController(CatalogReader reader, CurrentUser currentUser, ProgressReader progress, QuizStatsReader quizStats) {
        this.reader = reader;
        this.currentUser = currentUser;
        this.progress = progress;
        this.quizStats = quizStats;
    }

    @GetMapping("/categories")
    public ApiResponse<List<CategoryView>> categories() {
        return ApiResponse.cacheable(reader.categories());
    }

    @GetMapping("/topics/{slug}")
    public ApiResponse<TopicResponse> topic(@PathVariable String slug, HttpServletResponse response) {
        var topic = requireFound(reader.topic(validSlug(slug)));
        return ApiResponse.cacheable(TopicResponse.of(topic, learnedAmong(slugsOf(topic.questions()), response)));
    }

    @GetMapping("/questions/{slug}")
    public ApiResponse<QuestionDetailResponse> question(@PathVariable String slug, HttpServletResponse response) {
        var question = requireFound(reader.question(validSlug(slug)));
        UserFlags flags = learnedAmong(List.of(question.slug()), response);
        return ApiResponse.cacheable(QuestionDetailResponse.from(question, flags == null ? null : flags.learned(question.slug()),
                flags == null ? null : flags.review(question.slug())));
    }

    /** 처음 온 사람에게 보여 줄 "자주 나오는 질문" 6개(필수도 3, 주제마다 하나씩 돌려 가며). 공개·캐시 대상이고 사용자 상태가 없다. */
    @GetMapping("/questions/featured")
    public ApiResponse<List<QuestionHeadingResponse>> featured() {
        return ApiResponse.cacheable(reader.featuredQuestions(FEATURED_LIMIT).stream()
                .map(h -> new QuestionHeadingResponse(h.slug(), h.title(), h.tier(), h.topicSlug(), h.topicName())).toList());
    }

    public record QuestionHeadingResponse(String slug, String title, String tier, String topicSlug, String topicName) {
    }

    private static final int FEATURED_LIMIT = 6;

    @GetMapping("/concepts")
    public ApiResponse<List<ConceptView>> concepts() {
        return ApiResponse.cacheable(reader.concepts());
    }

    @GetMapping("/concepts/{slug}")
    public ApiResponse<ConceptDetailResponse> concept(@PathVariable String slug, HttpServletResponse response) {
        var detail = requireFound(reader.concept(validSlug(slug)));
        return ApiResponse.cacheable(ConceptDetailResponse.of(detail, learnedAmong(slugsOf(detail.questions()), response)));
    }

    @GetMapping("/search")
    public ApiResponse<SearchResponse> search(@RequestParam("q") String q, @RequestParam(value = "limit", required = false) Integer limit,
                                              HttpServletResponse response) {
        var result = reader.search(SearchQuery.parse(q, limit));
        return ApiResponse.cacheable(SearchResponse.of(result,
                learnedAmong(result.hits().stream().map(h -> h.question().slug()).toList(), response)));
    }

    private static List<String> slugsOf(List<QuestionSummary> questions) {
        return questions.stream().map(QuestionSummary::slug).toList();
    }

    /**
     * 로그인한 사용자라면 주어진 질문 중 체크한 것과 "다시 공부 후보"(응답이 사용자별이라 `private` 표시), 비로그인이면 null.
     * 사용자 행은 만들지 않는 읽기 전용 조회다(행은 첫 쓰기에서 생긴다).
     */
    private UserFlags learnedAmong(List<String> slugs, HttpServletResponse response) {
        Optional<UUID> user = currentUser.id();
        if (user.isEmpty()) {
            return null;
        }
        response.setHeader("Cache-Control", "private, no-cache");
        Set<String> learned = progress.learnedAmong(user.get(), slugs);
        // 후보 = 체크했고 마지막 출제 결과가 틀림. 체크 해제하면 후보에서도 빠진다.
        Set<String> review = new java.util.HashSet<>(quizStats.lastWrongAmong(user.get(), slugs));
        review.retainAll(learned);
        return new UserFlags(learned, Set.copyOf(review));
    }

    private static String validSlug(String slug) {
        if (slug.length() > MAX_SLUG_LENGTH || !SLUG.matcher(slug).matches()) {
            throw notFound();
        }
        return slug;
    }

    private static <T> T requireFound(java.util.Optional<T> found) {
        return found.orElseThrow(CatalogController::notFound);
    }

    private static InterviewException notFound() {
        return new InterviewException(ErrorCode.NOT_FOUND);
    }
}
