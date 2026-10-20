package com.doro.interview.api;

import com.doro.interview.account.CurrentUser;
import com.doro.interview.common.exception.ErrorCode;
import com.doro.interview.common.exception.InterviewException;
import com.doro.interview.common.response.ApiResponse;
import com.doro.interview.progress.ProgressService;
import com.doro.interview.progress.ProgressService.Summary;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * 학습 체크 API(docs/M2-PLAN.md D9). 전부 로그인이 필요하다(없으면 401). 사용자 id 는 토큰에서만 얻고 경로·본문·쿼리에 받지 않는다:
 * 남의 id 를 넣을 자리가 없다. 보이지 않는 질문·주제는 사전 API 와 같은 404 다. 응답은 사용자별이라 어디에도 저장하지 않는다.
 *
 * <p>요청 본문은 정해진 필드만 정확히 받고(모르는 필드 거부) 값은 JSON 의 정확한 타입만 받는다("false" 문자열이나 1 은 거부). 본문 검증은 **인증 뒤에** 한다(익명 요청이 400 으로
 * 존재를 더듬지 못하게).
 */
@RestController
@RequestMapping("/api/v1/progress")
public class ProgressController {

    private static final Pattern SLUG = Pattern.compile("[a-z0-9]+(-[a-z0-9]+)*");
    private static final int MAX_SLUG_LENGTH = 60;

    private final CurrentUser currentUser;
    private final ProgressService progress;

    public ProgressController(CurrentUser currentUser, ProgressService progress) {
        this.currentUser = currentUser;
        this.progress = progress;
    }

    public record LearnedResponse(String slug, boolean learned) {
    }

    public record TopicLearnedResponse(String topic, boolean learned, int count) {
    }

    @PutMapping("/{slug}")
    public ResponseEntity<ApiResponse<LearnedResponse>> setLearned(@PathVariable String slug, @RequestBody Map<String, Object> request) {
        UUID user = currentUser.require();
        requireExactly(request, Set.of("learned"));
        boolean learned = requireBoolean(request.get("learned"));
        String valid = validSlug(slug);
        progress.setLearned(user, valid, learned);
        return noStore(ApiResponse.success(new LearnedResponse(valid, learned)));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<TopicLearnedResponse>> setTopic(@RequestBody Map<String, Object> request) {
        UUID user = currentUser.require();
        requireExactly(request, Set.of("topic", "learned", "expectedCount"));
        if (!(request.get("topic") instanceof String topic)) {
            throw invalid();
        }
        boolean learned = requireBoolean(request.get("learned"));
        int expectedCount = requireCount(request.get("expectedCount"));
        String valid = validSlug(topic);
        int count = progress.setTopic(user, valid, learned, expectedCount);
        return noStore(ApiResponse.success(new TopicLearnedResponse(valid, learned, count)));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Summary>> summary() {
        return noStore(ApiResponse.success(progress.summary(currentUser.require())));
    }

    /** 알려진 필드만, 전부 있어야 한다(모르는 필드는 거부 — 남의 id 를 슬쩍 끼워 넣을 자리를 두지 않는다). */
    private static void requireExactly(Map<String, Object> body, Set<String> keys) {
        if (!body.keySet().equals(keys)) {
            throw invalid();
        }
    }

    private static boolean requireBoolean(Object value) {
        if (value instanceof Boolean b) {
            return b;
        }
        throw invalid();
    }

    /** 확인창에 보여 준 개수: 0 이상의 정수만(문자열·소수·음수 거부). */
    private static int requireCount(Object value) {
        if (value instanceof Integer i && i >= 0) {
            return i;
        }
        throw invalid();
    }

    private static String validSlug(String slug) {
        if (slug.length() > MAX_SLUG_LENGTH || !SLUG.matcher(slug).matches()) {
            throw new InterviewException(ErrorCode.NOT_FOUND);
        }
        return slug;
    }

    private static InterviewException invalid() {
        return new InterviewException(ErrorCode.INVALID_INPUT);
    }

    private static <T> ResponseEntity<ApiResponse<T>> noStore(ApiResponse<T> body) {
        return ResponseEntity.ok().header(HttpHeaders.CACHE_CONTROL, "no-store").body(body);
    }
}
