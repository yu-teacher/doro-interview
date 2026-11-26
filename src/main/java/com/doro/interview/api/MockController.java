package com.doro.interview.api;

import com.doro.interview.account.CurrentUser;
import com.doro.interview.catalog.CatalogViews.QuestionHeading;
import com.doro.interview.common.exception.ErrorCode;
import com.doro.interview.common.exception.InterviewException;
import com.doro.interview.common.response.ApiResponse;
import com.doro.interview.quiz.MockPlanner.Origin;
import com.doro.interview.quiz.MockService;
import com.doro.interview.quiz.MockService.SessionView;
import com.doro.interview.quiz.MockService.TurnView;
import com.doro.interview.quiz.QuizService.Result;
import com.doro.interview.quiz.QuizService.Scope;
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
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * 꼬리질문 모의면접 API(docs/M7-PLAN.md §5). 시험(M3)과 같은 규칙이다: **쓰기는 전부 PUT**, 세션 id 는 클라이언트가 만든 UUID,
 * 로그인 필요(없으면 401, 본문 검증은 인증 뒤), 남의 세션은 404, 응답은 저장하지 않으며 **모범 답변은 싣지 않는다**.
 * 결과를 기록하면 응답에 서버가 정한 다음 턴이 들어 있다(없으면 세션이 끝난 것이다).
 */
@RestController
@RequestMapping("/api/v1/mock")
public class MockController {

    private static final Pattern SLUG = Pattern.compile("[a-z0-9]+(-[a-z0-9]+)*");
    private static final Set<String> TIERS = Set.of("BASIC", "DEEP", "TRICKY");
    private static final int MAX_SCOPE_ENTRIES = 20;
    private static final int MAX_SLUG_LENGTH = 60;

    private final CurrentUser currentUser;
    private final MockService mock;
    private final QuestionHeadings headings;

    public MockController(CurrentUser currentUser, MockService mock, QuestionHeadings headings) {
        this.currentUser = currentUser;
        this.mock = mock;
        this.headings = headings;
    }

    public record TurnResponse(int seq, Integer parentSeq, int depth, Origin origin, String questionSlug, String title, String tier, String topicSlug,
                               String topicName, Result result, Integer seconds, String answerText, Instant answeredAt) {
    }

    public record SessionResponse(UUID sessionId, int mainCount, int plannedMains, int maxDepth, boolean includeUnlearned, Instant startedAt,
                                  Instant finishedAt, List<TurnResponse> turns) {
    }

    @PutMapping("/{sessionId}")
    public ResponseEntity<ApiResponse<SessionResponse>> start(@PathVariable String sessionId, @RequestBody Map<String, Object> request) {
        UUID user = currentUser.require();
        requireKeys(request, Set.of("mainCount", "maxDepth", "includeUnlearned"), Set.of("categories", "topics", "tiers"));
        int mainCount = requireInt(request.get("mainCount"));
        int maxDepth = requireInt(request.get("maxDepth"));
        if (!(request.get("includeUnlearned") instanceof Boolean includeUnlearned)) {
            throw invalid();
        }
        Scope scope = new Scope(slugList(request.get("categories")), slugList(request.get("topics")), tierList(request.get("tiers")));
        UUID id = sessionUuid(sessionId);
        return noStore(ApiResponse.success(respond(user, mock.start(user, id, scope, includeUnlearned, mainCount, maxDepth))));
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<ApiResponse<SessionResponse>> get(@PathVariable String sessionId) {
        UUID user = currentUser.require();
        return noStore(ApiResponse.success(respond(user, mock.get(user, sessionUuid(sessionId)))));
    }

    @PutMapping("/{sessionId}/turns/{seq}")
    public ResponseEntity<ApiResponse<SessionResponse>> record(@PathVariable String sessionId, @PathVariable String seq,
                                                              @RequestBody Map<String, Object> request) {
        UUID user = currentUser.require();
        requireKeys(request, Set.of("result"), Set.of("seconds", "answerText"));
        Result result = request.get("result") instanceof String r && List.of("CORRECT", "WRONG", "SKIPPED").contains(r) ? Result.valueOf(r) : fail();
        Integer seconds = request.get("seconds") == null ? null : requireInt(request.get("seconds"));
        Object answer = request.get("answerText");
        if (answer != null && !(answer instanceof String)) {
            throw invalid();
        }
        return noStore(ApiResponse.success(respond(user, mock.record(user, sessionUuid(sessionId), seqNumber(seq), result, seconds, (String) answer))));
    }

    @PutMapping("/{sessionId}/finish")
    public ResponseEntity<ApiResponse<SessionResponse>> finish(@PathVariable String sessionId,
                                                              @RequestBody(required = false) Map<String, Object> request) {
        UUID user = currentUser.require();
        if (request != null && !request.isEmpty()) {
            throw invalid();
        }
        return noStore(ApiResponse.success(respond(user, mock.finish(user, sessionUuid(sessionId)))));
    }

    // ------------------------------------------------------------------ 응답 조립

    /** 턴에 제목·tier·주제를 붙인다(모범 답변은 없다). 그 사이 닫혔거나 비공개가 된 질문은 제목 없이 slug 만 나간다. */
    private SessionResponse respond(UUID user, SessionView view) {
        Map<String, QuestionHeading> found = headings.of(user, view.turns().stream().map(TurnView::questionSlug).filter(Objects::nonNull).toList());
        List<TurnResponse> turns = new ArrayList<>();
        for (TurnView t : view.turns()) {
            QuestionHeading h = t.questionSlug() == null ? null : found.get(t.questionSlug());
            turns.add(new TurnResponse(t.seq(), t.parentSeq(), t.depth(), t.origin(), t.questionSlug(), h == null ? null : h.title(),
                    h == null ? null : h.tier(), h == null ? null : h.topicSlug(), h == null ? null : h.topicName(), t.result(), t.seconds(),
                    t.answerText(), t.answeredAt()));
        }
        return new SessionResponse(view.sessionId(), view.mainCount(), view.plannedMains(), view.maxDepth(), view.includeUnlearned(),
                view.startedAt(), view.finishedAt(), List.copyOf(turns));
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

    /** 모의면접에는 내 질문(가짜 주제 {@code @mine})이 없다: 연결이 없어 꼬리를 이을 수 없다. */
    private static List<String> slugList(Object value) {
        if (value == null) {
            return List.of();
        }
        if (!(value instanceof List<?> list) || list.size() > MAX_SCOPE_ENTRIES) {
            throw invalid();
        }
        List<String> out = new ArrayList<>();
        for (Object o : list) {
            if (!(o instanceof String s) || s.length() > MAX_SLUG_LENGTH || !SLUG.matcher(s).matches()) {
                throw invalid();
            }
            out.add(s);
        }
        return out;
    }

    private static List<String> tierList(Object value) {
        if (value == null) {
            return List.of();
        }
        if (!(value instanceof List<?> list) || list.size() > TIERS.size()) {
            throw invalid();
        }
        List<String> out = new ArrayList<>();
        for (Object o : list) {
            if (!(o instanceof String s) || !TIERS.contains(s)) {
                throw invalid();
            }
            out.add(s);
        }
        return out;
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
