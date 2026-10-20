package com.doro.interview.api;

import com.doro.interview.account.CurrentUser;
import com.doro.interview.catalog.CatalogViews.QuestionHeading;
import com.doro.interview.common.exception.ErrorCode;
import com.doro.interview.mine.read.MyQuestionReader;
import com.doro.interview.common.exception.InterviewException;
import com.doro.interview.common.response.ApiResponse;
import com.doro.interview.quiz.QuizPicker.Mode;
import com.doro.interview.quiz.QuizService;
import com.doro.interview.quiz.QuizService.ItemView;
import com.doro.interview.quiz.QuizService.Result;
import com.doro.interview.quiz.QuizService.Scope;
import com.doro.interview.quiz.QuizService.SessionView;
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
import java.util.regex.Pattern;

/**
 * 랜덤 면접 API(docs/M3-PLAN.md D1): **쓰기는 전부 PUT** 이고 세션 id 는 클라이언트가 만든 UUID 다(게이트웨이가 PUT 만 통과시키고 멱등이 공짜로 따라온다).
 * 로그인이 필요하고(없으면 401, 본문 검증은 인증 뒤), 사용자 id 는 토큰에서만 얻는다. 남의 세션은 없는 것과 같은 404 다.
 * 응답은 사용자별이라 어디에도 저장하지 않으며, **모범 답변은 싣지 않는다**(문제 화면에서 미리 보이지 않게; 답은 질문 API 로 따로 받는다).
 */
@RestController
@RequestMapping("/api/v1/quiz")
public class QuizController {

    private static final Pattern SLUG = Pattern.compile("[a-z0-9]+(-[a-z0-9]+)*");
    private static final Set<String> TIERS = Set.of("BASIC", "DEEP", "TRICKY");
    private static final int MAX_SCOPE_ENTRIES = 20;
    private static final int MAX_SLUG_LENGTH = 60;

    private final CurrentUser currentUser;
    private final QuizService quiz;
    private final QuestionHeadings headings;

    public QuizController(CurrentUser currentUser, QuizService quiz, QuestionHeadings headings) {
        this.currentUser = currentUser;
        this.quiz = quiz;
        this.headings = headings;
    }

    public record ItemResponse(int seq, String questionSlug, String title, String tier, String topicSlug, String topicName, Result result,
                               Integer seconds, String answerText, Instant answeredAt) {
    }

    public record SessionResponse(UUID sessionId, int plannedCount, boolean includeUnlearned, Mode mode, Instant startedAt, Instant finishedAt,
                                  List<ItemResponse> items) {
    }

    @PutMapping("/{sessionId}")
    public ResponseEntity<ApiResponse<SessionResponse>> start(@PathVariable String sessionId, @RequestBody Map<String, Object> request) {
        UUID user = currentUser.require();
        requireKeys(request, Set.of("count", "includeUnlearned"), Set.of("categories", "topics", "tiers", "mode"));
        int count = requireInt(request.get("count"));
        if (!(request.get("includeUnlearned") instanceof Boolean includeUnlearned)) {
            throw invalid();
        }
        Scope scope = new Scope(slugList(request.get("categories"), false), slugList(request.get("topics"), true), tierList(request.get("tiers")));
        Mode mode = Mode.WEIGHTED;
        if (request.containsKey("mode")) {
            mode = request.get("mode") instanceof String m && (m.equals("WEIGHTED") || m.equals("RANDOM")) ? Mode.valueOf(m) : fail();
        }
        UUID id = sessionUuid(sessionId);
        return noStore(ApiResponse.success(respond(user, quiz.start(user, id, scope, includeUnlearned, count, mode))));
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<ApiResponse<SessionResponse>> get(@PathVariable String sessionId) {
        UUID user = currentUser.require();
        return noStore(ApiResponse.success(respond(user, quiz.get(user, sessionUuid(sessionId)))));
    }

    @PutMapping("/{sessionId}/items/{seq}")
    public ResponseEntity<ApiResponse<SessionResponse>> record(@PathVariable String sessionId, @PathVariable String seq,
                                                              @RequestBody Map<String, Object> request) {
        UUID user = currentUser.require();
        requireKeys(request, Set.of("result"), Set.of("seconds", "answerText"));
        Result result = request.get("result") instanceof String r && List.of("CORRECT", "WRONG", "SKIPPED").contains(r) ? Result.valueOf(r) : fail();
        Integer seconds = request.containsKey("seconds") ? (request.get("seconds") == null ? null : requireInt(request.get("seconds"))) : null;
        String answer = null;
        if (request.containsKey("answerText")) {
            if (request.get("answerText") != null && !(request.get("answerText") instanceof String)) {
                throw invalid();
            }
            answer = (String) request.get("answerText");
        }
        UUID id = sessionUuid(sessionId);
        quiz.record(user, id, seqNumber(seq), result, seconds, answer);
        return noStore(ApiResponse.success(respond(user, quiz.get(user, id))));
    }

    @PutMapping("/{sessionId}/finish")
    public ResponseEntity<ApiResponse<SessionResponse>> finish(@PathVariable String sessionId,
                                                              @RequestBody(required = false) Map<String, Object> request) {
        UUID user = currentUser.require();
        if (request != null && !request.isEmpty()) {
            throw invalid();
        }
        UUID id = sessionUuid(sessionId);
        quiz.finish(user, id);
        return noStore(ApiResponse.success(respond(user, quiz.get(user, id))));
    }

    // ------------------------------------------------------------------ 응답 조립

    /** 문항에 제목·tier·주제를 붙인다(모범 답변은 없다). 그 사이 닫혔거나 비공개가 된 질문은 제목 없이 slug 만 나간다. */
    private SessionResponse respond(UUID user, SessionView view) {
        Map<String, QuestionHeading> headings = this.headings.of(user, view.items().stream().map(ItemView::questionSlug).toList());
        List<ItemResponse> items = new ArrayList<>();
        for (ItemView i : view.items()) {
            QuestionHeading h = headings.get(i.questionSlug());
            items.add(new ItemResponse(i.seq(), i.questionSlug(), h == null ? null : h.title(), h == null ? null : h.tier(),
                    h == null ? null : h.topicSlug(), h == null ? null : h.topicName(), i.result(), i.seconds(), i.answerText(), i.answeredAt()));
        }
        return new SessionResponse(view.sessionId(), view.plannedCount(), view.includeUnlearned(), view.mode(), view.startedAt(), view.finishedAt(),
                List.copyOf(items));
    }

    // ------------------------------------------------------------------ 입력 검증

    private static UUID sessionUuid(String value) {
        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException e) {
            throw new InterviewException(ErrorCode.NOT_FOUND); // 형식이 틀린 id 는 없는 세션과 같다
        }
    }

    private static int seqNumber(String value) {
        try {
            int n = Integer.parseInt(value);
            if (n >= 1) {
                return n;
            }
        } catch (NumberFormatException e) {
            // 아래에서 404
        }
        throw new InterviewException(ErrorCode.NOT_FOUND);
    }

    private static void requireKeys(Map<String, Object> body, Set<String> required, Set<String> optional) {
        if (!body.keySet().containsAll(required)) {
            throw invalid();
        }
        for (String key : body.keySet()) {
            if (!required.contains(key) && !optional.contains(key)) {
                throw invalid();
            }
        }
    }

    private static int requireInt(Object value) {
        if (value instanceof Integer i) {
            return i;
        }
        throw invalid();
    }

    /** {@code allowMine}: 주제 목록에서만 가짜 주제 {@code @mine}(내 질문)을 받는다. */
    private static List<String> slugList(Object value, boolean allowMine) {
        if (value == null) {
            return List.of();
        }
        if (!(value instanceof List<?> list) || list.size() > MAX_SCOPE_ENTRIES) {
            throw invalid();
        }
        List<String> out = new ArrayList<>();
        for (Object o : list) {
            boolean mine = allowMine && o instanceof String m && m.equals(MyQuestionReader.PSEUDO_TOPIC);
            if (!mine && (!(o instanceof String s) || s.length() > MAX_SLUG_LENGTH || !SLUG.matcher(s).matches())) {
                throw invalid();
            }
            out.add((String) o);
        }
        return out;
    }

    private static List<String> tierList(Object value) {
        List<String> tiers = slugList(value == null ? null : (value instanceof List<?> l ? l.stream().map(o -> o instanceof String s ? s.toLowerCase() : o).toList() : value), false);
        List<String> upper = tiers.stream().map(String::toUpperCase).toList();
        if (!TIERS.containsAll(upper)) {
            throw invalid();
        }
        return upper;
    }

    private static <T> T fail() {
        throw invalid();
    }

    private static InterviewException invalid() {
        return new InterviewException(ErrorCode.INVALID_INPUT);
    }

    private static <T> ResponseEntity<ApiResponse<T>> noStore(ApiResponse<T> body) {
        return ResponseEntity.ok().header(HttpHeaders.CACHE_CONTROL, "no-store").body(body);
    }
}
