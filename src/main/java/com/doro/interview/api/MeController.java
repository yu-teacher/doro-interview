package com.doro.interview.api;

import com.doro.interview.account.CurrentUser;
import com.doro.interview.catalog.CatalogReader;
import com.doro.interview.catalog.CatalogViews.QuestionHeading;
import com.doro.interview.common.exception.ErrorCode;
import com.doro.interview.common.exception.InterviewException;
import com.doro.interview.common.response.ApiResponse;
import com.doro.interview.progress.read.ProgressReader;
import com.doro.interview.quiz.QuizService;
import com.doro.interview.quiz.QuizService.MissedQuestion;
import com.doro.interview.quiz.read.QuizStatsReader;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * 내 현황·설정·다시 공부 후보(docs/M3-PLAN.md S5). 전부 로그인이 필요하고 본인 것만 돌려준다(사용자 id 는 토큰에서만 얻는다).
 * 응답은 사용자별이라 어디에도 저장하지 않는다. 보이지 않게 된 질문(닫힘·비공개)은 목록에서 빠진다.
 */
@RestController
@RequestMapping("/api/v1")
public class MeController {

    private final CurrentUser currentUser;
    private final QuizService quiz;
    private final QuizStatsReader quizStats;
    private final ProgressReader progress;
    private final CatalogReader catalog;

    public MeController(CurrentUser currentUser, QuizService quiz, QuizStatsReader quizStats, ProgressReader progress, CatalogReader catalog) {
        this.currentUser = currentUser;
        this.quiz = quiz;
        this.quizStats = quizStats;
        this.progress = progress;
        this.catalog = catalog;
    }

    public record MissedResponse(String questionSlug, String title, String tier, String topicSlug, String topicName, int missCount, int askCount) {
    }

    public record StatsResponse(int askedLast30Days, int correctLast30Days, int wrongLast30Days, int skippedLast30Days, int sessionsLast30Days,
                                List<MissedResponse> mostMissed) {
    }

    public record CandidateResponse(String slug, String title, String tier, String topicSlug, String topicName) {
    }

    public record PrefsResponse(boolean includeUnlearnedDefault) {
    }

    @GetMapping("/me/stats")
    public ResponseEntity<ApiResponse<StatsResponse>> stats() {
        UUID user = currentUser.require();
        QuizService.Stats s = quiz.stats(user);
        Map<String, QuestionHeading> headings = catalog.visibleQuestionHeadings(s.mostMissed().stream().map(MissedQuestion::questionSlug).toList());
        List<MissedResponse> missed = new ArrayList<>();
        for (MissedQuestion m : s.mostMissed()) {
            QuestionHeading h = headings.get(m.questionSlug());
            if (h != null) { // 닫히거나 비공개가 된 질문은 보여 주지 않는다
                missed.add(new MissedResponse(m.questionSlug(), h.title(), h.tier(), h.topicSlug(), h.topicName(), m.missCount(), m.askCount()));
            }
        }
        return noStore(new StatsResponse(s.askedLast30Days(), s.correctLast30Days(), s.wrongLast30Days(), s.skippedLast30Days(), s.sessionsLast30Days(), List.copyOf(missed)));
    }

    /** 다시 공부 후보: 체크했고 마지막 출제 결과가 틀림(이후 맞음이 나오면 사라진다). */
    @GetMapping("/review-candidates")
    public ResponseEntity<ApiResponse<List<CandidateResponse>>> reviewCandidates() {
        UUID user = currentUser.require();
        Set<String> wrong = quizStats.lastWrong(user);
        Set<String> candidates = progress.learnedAmong(user, wrong);
        Map<String, QuestionHeading> headings = catalog.visibleQuestionHeadings(candidates);
        List<CandidateResponse> list = headings.values().stream()
                .sorted(java.util.Comparator.comparing(QuestionHeading::topicSlug).thenComparing(QuestionHeading::slug))
                .map(h -> new CandidateResponse(h.slug(), h.title(), h.tier(), h.topicSlug(), h.topicName()))
                .toList();
        return noStore(list);
    }

    @GetMapping("/me/prefs")
    public ResponseEntity<ApiResponse<PrefsResponse>> prefs() {
        return noStore(new PrefsResponse(quiz.includeUnlearnedDefault(currentUser.require())));
    }

    @PutMapping("/me/prefs")
    public ResponseEntity<ApiResponse<PrefsResponse>> setPrefs(@RequestBody Map<String, Object> request) {
        UUID user = currentUser.require();
        if (!request.keySet().equals(Set.of("includeUnlearnedDefault")) || !(request.get("includeUnlearnedDefault") instanceof Boolean value)) {
            throw new InterviewException(ErrorCode.INVALID_INPUT);
        }
        quiz.setIncludeUnlearnedDefault(user, value);
        return noStore(new PrefsResponse(value));
    }

    private static <T> ResponseEntity<ApiResponse<T>> noStore(T data) {
        return ResponseEntity.ok().header(HttpHeaders.CACHE_CONTROL, "no-store").body(ApiResponse.success(data));
    }
}
