package com.doro.interview.api;

import com.doro.interview.account.CurrentUser;
import com.doro.interview.common.exception.ErrorCode;
import com.doro.interview.common.exception.InterviewException;
import com.doro.interview.common.response.ApiResponse;
import com.doro.interview.mine.MyQuestionService;
import com.doro.interview.mine.MyQuestionService.BatchItem;
import com.doro.interview.mine.MyQuestionService.Draft;
import com.doro.interview.mine.MyQuestionService.Question;
import com.doro.interview.progress.read.ProgressReader;
import com.fasterxml.jackson.annotation.JsonInclude;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 내 질문 API(docs/M4-PLAN.md D3). 로그인이 필요하고(없으면 401), 사용자 id 는 토큰에서만 얻는다. 쓰기는 전부 PUT 이다
 * (게이트웨이가 PUT 만 통과시킨다). 남의 id 와 없는 id 는 같은 404 이고, 응답은 개인 내용이라 어디에도 저장하지 않는다.
 * 본문은 정해진 필드만 정확한 JSON 타입으로 받는다(모르는 필드·잘못된 타입은 400).
 */
@RestController
@RequestMapping("/api/v1/mine")
public class MineController {

    private static final Set<String> DRAFT_KEYS = Set.of("title", "answerText", "keywords", "tier", "sourceLabel");

    private final CurrentUser currentUser;
    private final MyQuestionService questions;
    private final ProgressReader progress;

    public MineController(CurrentUser currentUser, MyQuestionService questions, ProgressReader progress) {
        this.currentUser = currentUser;
        this.questions = questions;
        this.progress = progress;
    }

    @JsonInclude(JsonInclude.Include.ALWAYS)
    public record MineResponse(UUID id, String slug, String title, String answerText, List<String> keywords, String tier,
                               String sourceLabel, Instant createdAt, Instant updatedAt, boolean learned) {
        static MineResponse of(Question q, Set<String> learned) {
            return new MineResponse(q.id(), q.slug(), q.title(), q.answerText(), q.keywords(), q.tier(), q.sourceLabel(),
                    q.createdAt(), q.updatedAt(), learned.contains(q.slug()));
        }
    }

    public record DeletedResponse(UUID id, boolean deleted) {
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<MineResponse>>> list() {
        UUID user = currentUser.require();
        List<Question> all = questions.list(user);
        Set<String> learned = progress.learnedAmong(user, all.stream().map(Question::slug).toList());
        return noStore(ApiResponse.success(all.stream().map(q -> MineResponse.of(q, learned)).toList()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MineResponse>> get(@PathVariable String id) {
        UUID user = currentUser.require();
        Question q = questions.get(user, uuid(id)).orElseThrow(() -> new InterviewException(ErrorCode.NOT_FOUND));
        return noStore(ApiResponse.success(MineResponse.of(q, progress.learnedAmong(user, List.of(q.slug())))));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MineResponse>> put(@PathVariable String id, @RequestBody Map<String, Object> request) {
        UUID user = currentUser.require();
        Draft draft = draft(request);
        UUID parsed = uuid(id);
        Question q = questions.put(user, parsed, draft);
        return noStore(ApiResponse.success(MineResponse.of(q, progress.learnedAmong(user, List.of(q.slug())))));
    }

    /** 일괄 추가: {@code {"items":[{"id":…, 제목 등}, …]}}. 전부 저장되거나 아무것도 저장되지 않는다. */
    @PutMapping
    public ResponseEntity<ApiResponse<List<MineResponse>>> putAll(@RequestBody Map<String, Object> request) {
        UUID user = currentUser.require();
        if (!request.keySet().equals(Set.of("items")) || !(request.get("items") instanceof List<?> raw)) {
            throw new InterviewException(ErrorCode.INVALID_INPUT);
        }
        List<BatchItem> items = new ArrayList<>();
        for (Object o : raw) {
            if (!(o instanceof Map<?, ?> m)) {
                throw new InterviewException(ErrorCode.INVALID_INPUT);
            }
            Map<String, Object> item = m.entrySet().stream().collect(Collectors.toMap(e -> String.valueOf(e.getKey()), Map.Entry::getValue));
            if (!(item.remove("id") instanceof String id)) {
                throw new InterviewException(ErrorCode.INVALID_INPUT);
            }
            items.add(new BatchItem(uuidOrInvalid(id), draft(item)));
        }
        List<Question> saved = questions.putAll(user, items);
        Set<String> learned = progress.learnedAmong(user, saved.stream().map(Question::slug).toList());
        return noStore(ApiResponse.success(saved.stream().map(q -> MineResponse.of(q, learned)).toList()));
    }

    /** 삭제도 PUT 이다(게이트웨이가 DELETE 를 막는다). 이미 없거나 남의 것이면 404 — 화면은 404 도 "이미 없음" 으로 본다. */
    @PutMapping("/{id}/deleted")
    public ResponseEntity<ApiResponse<DeletedResponse>> delete(@PathVariable String id, @RequestBody Map<String, Object> request) {
        UUID user = currentUser.require();
        if (!request.keySet().equals(Set.of("deleted")) || !Boolean.TRUE.equals(request.get("deleted"))) {
            throw new InterviewException(ErrorCode.INVALID_INPUT);
        }
        UUID parsed = uuid(id);
        if (!questions.delete(user, parsed)) {
            throw new InterviewException(ErrorCode.NOT_FOUND);
        }
        return noStore(ApiResponse.success(new DeletedResponse(parsed, true)));
    }

    @SuppressWarnings("unchecked")
    private static Draft draft(Map<String, Object> body) {
        if (!DRAFT_KEYS.containsAll(body.keySet()) || !(body.get("title") instanceof String title)) {
            throw new InterviewException(ErrorCode.INVALID_INPUT);
        }
        String answer = optionalString(body, "answerText", "");
        String tier = optionalString(body, "tier", "BASIC");
        String source = optionalString(body, "sourceLabel", null);
        List<String> keywords = new ArrayList<>();
        Object k = body.get("keywords");
        if (k != null) {
            if (!(k instanceof List<?> list)) {
                throw new InterviewException(ErrorCode.INVALID_INPUT);
            }
            for (Object o : list) {
                if (!(o instanceof String s)) {
                    throw new InterviewException(ErrorCode.INVALID_INPUT);
                }
                keywords.add(s);
            }
        }
        return new Draft(title, answer, keywords, tier, source);
    }

    private static String optionalString(Map<String, Object> body, String key, String fallback) {
        Object v = body.get(key);
        if (v == null) {
            return fallback;
        }
        if (!(v instanceof String s)) {
            throw new InterviewException(ErrorCode.INVALID_INPUT);
        }
        return s;
    }

    /** 경로의 id: UUID 형식이 아니면 없는 것과 같은 404. */
    private static UUID uuid(String id) {
        try {
            UUID parsed = UUID.fromString(id);
            if (parsed.toString().equals(id)) {
                return parsed;
            }
        } catch (IllegalArgumentException ignored) {
            // 아래에서 404
        }
        throw new InterviewException(ErrorCode.NOT_FOUND);
    }

    /** 본문의 id: 형식이 틀리면 입력 오류(400). */
    private static UUID uuidOrInvalid(String id) {
        try {
            UUID parsed = UUID.fromString(id);
            if (parsed.toString().equals(id)) {
                return parsed;
            }
        } catch (IllegalArgumentException ignored) {
            // 아래에서 400
        }
        throw new InterviewException(ErrorCode.INVALID_INPUT);
    }

    private static <T> ResponseEntity<ApiResponse<T>> noStore(ApiResponse<T> body) {
        return ResponseEntity.ok().header(HttpHeaders.CACHE_CONTROL, "no-store").body(body);
    }
}
