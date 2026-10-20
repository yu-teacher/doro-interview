package com.doro.interview.api;

import com.doro.interview.catalog.CatalogReader;
import com.doro.interview.catalog.CatalogViews.CategoryView;
import com.doro.interview.catalog.CatalogViews.ConceptDetail;
import com.doro.interview.catalog.CatalogViews.ConceptView;
import com.doro.interview.catalog.CatalogViews.SearchResult;
import com.doro.interview.catalog.CatalogViews.TopicView;
import com.doro.interview.catalog.SearchQuery;
import com.doro.interview.common.exception.ErrorCode;
import com.doro.interview.common.exception.InterviewException;
import com.doro.interview.common.response.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.regex.Pattern;

/**
 * 사전 읽기 API(로그인 없이 호출한다). 공개 주제·닫히지 않은 질문만 보이고, 그 밖의 것은 **없는 것과 똑같은 404** 로 답한다
 * (존재 여부를 드러내지 않는다). 성공 응답은 ETag 가 동작하도록 timestamp 가 없다({@link ApiResponse#cacheable}). 이 계층은 합성 계층이라 M2 에서 여기서 사용자 상태(learned 등)를 합친다.
 */
@RestController
@RequestMapping("/api/v1")
public class CatalogController {

    /** slug 형식이 아니면 조회하지 않고 바로 404 로 답한다. */
    private static final Pattern SLUG = Pattern.compile("[a-z0-9]+(-[a-z0-9]+)*");
    private static final int MAX_SLUG_LENGTH = 60;

    private final CatalogReader reader;

    public CatalogController(CatalogReader reader) {
        this.reader = reader;
    }

    @GetMapping("/categories")
    public ApiResponse<List<CategoryView>> categories() {
        return ApiResponse.cacheable(reader.categories());
    }

    @GetMapping("/topics/{slug}")
    public ApiResponse<TopicView> topic(@PathVariable String slug) {
        return ApiResponse.cacheable(requireFound(reader.topic(validSlug(slug))));
    }

    @GetMapping("/questions/{slug}")
    public ApiResponse<QuestionDetailResponse> question(@PathVariable String slug) {
        return ApiResponse.cacheable(QuestionDetailResponse.from(requireFound(reader.question(validSlug(slug)))));
    }

    @GetMapping("/concepts")
    public ApiResponse<List<ConceptView>> concepts() {
        return ApiResponse.cacheable(reader.concepts());
    }

    @GetMapping("/concepts/{slug}")
    public ApiResponse<ConceptDetail> concept(@PathVariable String slug) {
        return ApiResponse.cacheable(requireFound(reader.concept(validSlug(slug))));
    }

    @GetMapping("/search")
    public ApiResponse<SearchResult> search(@RequestParam("q") String q, @RequestParam(value = "limit", required = false) Integer limit) {
        return ApiResponse.cacheable(reader.search(SearchQuery.parse(q, limit)));
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
