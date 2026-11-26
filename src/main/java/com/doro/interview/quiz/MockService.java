package com.doro.interview.quiz;

import com.doro.interview.catalog.CatalogReader;
import com.doro.interview.catalog.CatalogViews.LinkEdge;
import com.doro.interview.catalog.CatalogViews.QuestionIndexEntry;
import com.doro.interview.common.exception.ErrorCode;
import com.doro.interview.common.exception.InterviewException;
import com.doro.interview.progress.read.ProgressReader;
import com.doro.interview.quiz.MockPlanner.Answered;
import com.doro.interview.quiz.MockPlanner.Next;
import com.doro.interview.quiz.MockPlanner.Origin;
import com.doro.interview.quiz.QuizPicker.Mode;
import com.doro.interview.quiz.QuizService.Result;
import com.doro.interview.quiz.QuizService.Scope;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.time.Clock;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.random.RandomGenerator;

import static com.doro.interview.quiz.QuizService.normalizeAnswer;
import static com.doro.interview.quiz.QuizService.toOffset;

/**
 * 꼬리질문 모의면접(docs/M7-PLAN.md M7a). 본 질문은 시작할 때 뽑고, 꼬리질문(FOLLOWUP)·기초 확인(PREREQ)은 결과를 기록할 때
 * {@link MockPlanner} 로 하나씩 정해 **같은 트랜잭션에서 저장**한다(D4): 새로고침하거나 같은 결과를 다시 보내도 같은 흐름이 이어진다.
 * 결과는 한 번 기록되면 고정이다(D5). 실제 질문 턴의 맞음·틀림은 시험과 같은 출제 통계에 반영한다(D6).
 * 사용자 id 는 항상 인자로 받고, 남의 세션은 없는 것과 같은 404 다. 진도는 읽기만 한다.
 */
@Service
public class MockService {

    public static final int MIN_MAINS = 1;
    public static final int MAX_MAINS = 5;
    public static final int MIN_DEPTH = 0;
    public static final int MAX_DEPTH = 3;

    public record TurnView(int seq, Integer parentSeq, int depth, Origin origin, String questionSlug, Result result, Integer seconds,
                           String answerText, Instant answeredAt) {
    }

    /** {@code plannedMains} 는 실제로 뽑힌 본 질문 수다(풀이 작으면 {@code mainCount} 보다 적다). */
    public record SessionView(UUID sessionId, int mainCount, int plannedMains, int maxDepth, boolean includeUnlearned, Instant startedAt,
                              Instant finishedAt, List<TurnView> turns) {
    }

    private final JdbcTemplate jdbc;
    private final CatalogReader catalog;
    private final ProgressReader progress;
    private final QuizService quiz;
    private final ObjectMapper json;
    private final RandomGenerator rng;
    private final Clock clock;

    @Autowired
    MockService(JdbcTemplate jdbc, CatalogReader catalog, ProgressReader progress, QuizService quiz, ObjectMapper json) {
        this(jdbc, catalog, progress, quiz, json, RandomGenerator.getDefault(), Clock.systemUTC());
    }

    /** 시험용: 난수와 시계를 정한다. */
    MockService(JdbcTemplate jdbc, CatalogReader catalog, ProgressReader progress, QuizService quiz, ObjectMapper json, RandomGenerator rng, Clock clock) {
        this.jdbc = jdbc;
        this.catalog = catalog;
        this.progress = progress;
        this.quiz = quiz;
        this.json = json;
        this.rng = rng;
        this.clock = clock;
    }

    // ------------------------------------------------------------------ 시작

    /**
     * 모의면접을 시작한다. 같은 {@code sessionId} 로 다시 부르면 같은 세션을 돌려준다(다른 인자는 무시). 본 질문 풀은
     * **꼬리질문(FOLLOWUP)이 하나 이상 있는 보이는 질문 ∩ 내 체크**(미학습 포함이면 보이는 질문 전부)이고, 내 질문은 연결이 없어 들어가지 않는다(D2).
     * 풀이 비면 세션을 만들지 않고 {@link ErrorCode#MOCK_POOL_EMPTY}.
     */
    @Transactional
    public SessionView start(UUID userId, UUID sessionId, Scope scope, boolean includeUnlearned, int mainCount, int maxDepth) {
        if (mainCount < MIN_MAINS || mainCount > MAX_MAINS) {
            throw new InterviewException(ErrorCode.INVALID_INPUT, "본 질문 수는 " + MIN_MAINS + "~" + MAX_MAINS + " 사이여야 합니다.");
        }
        if (maxDepth < MIN_DEPTH || maxDepth > MAX_DEPTH) {
            throw new InterviewException(ErrorCode.INVALID_INPUT, "꼬리질문 깊이는 " + MIN_DEPTH + "~" + MAX_DEPTH + " 사이여야 합니다.");
        }
        if (exists(sessionId)) {
            return view(userId, sessionId);
        }

        Set<String> withFollowups = linkMap("FOLLOWUP").keySet();
        Set<String> learned = includeUnlearned ? null : progress.learnedSlugs(userId);
        List<String> pool = catalog.visibleQuestionIndex().stream()
                .filter(scope::accepts)
                .map(QuestionIndexEntry::slug)
                .filter(withFollowups::contains)
                .filter(slug -> learned == null || learned.contains(slug))
                .toList();
        if (pool.isEmpty()) {
            throw new InterviewException(ErrorCode.MOCK_POOL_EMPTY);
        }

        Instant now = clock.instant();
        List<String> mains = QuizPicker.pick(pool, quiz.statsFor(userId, pool), previousMains(userId), mainCount, Mode.WEIGHTED, rng, now);

        // 같은 id 로 동시에 시작해도 한 쪽만 만든다(다른 쪽은 커밋을 기다렸다가 같은 세션을 본다)
        int inserted = jdbc.update("""
                INSERT INTO mock_session (id, user_id, main_slugs, main_count, max_depth, include_unlearned, scope, started_at)
                VALUES (?, ?, ?::jsonb, ?, ?, ?, ?::jsonb, ?) ON CONFLICT (id) DO NOTHING""",
                sessionId, userId, json.writeValueAsString(mains), mainCount, maxDepth, includeUnlearned, scopeJson(scope), toOffset(now));
        if (inserted > 0) {
            insertTurn(sessionId, 1, new Next(mains.get(0), Origin.MAIN, 0, null));
        }
        return view(userId, sessionId);
    }

    // ------------------------------------------------------------------ 조회

    @Transactional(readOnly = true)
    public SessionView get(UUID userId, UUID sessionId) {
        return view(userId, sessionId);
    }

    // ------------------------------------------------------------------ 결과 기록 → 다음 턴

    /**
     * 한 턴의 결과를 기록하고 다음 턴을 정해 저장한다. 다음 턴이 없으면 세션을 끝낸다. 같은 결과를 다시 보내면 아무것도 바꾸지 않고
     * 같은 세션(이미 정해진 다음 턴 포함)을 돌려준다. 다른 결과는 409, 끝난 세션은 409.
     */
    @Transactional
    public SessionView record(UUID userId, UUID sessionId, int seq, Result result, Integer seconds, String answerText) {
        String answer = normalizeAnswer(answerText);
        if (seconds != null && (seconds < 0 || seconds > 86_400)) {
            throw new InterviewException(ErrorCode.INVALID_INPUT, "걸린 시간이 올바르지 않습니다.");
        }
        // 세션 행을 잠가 한 세션의 기록을 한 줄로 세운다(다음 턴의 seq 와 통계가 한 번만 정해진다)
        List<Map<String, Object>> sessions = jdbc.queryForList("""
                SELECT main_slugs::text AS mains, max_depth, finished_at FROM mock_session WHERE id = ? AND user_id = ? FOR UPDATE""",
                sessionId, userId);
        if (sessions.isEmpty()) {
            throw new InterviewException(ErrorCode.NOT_FOUND);
        }
        Map<String, Object> session = sessions.get(0);
        List<Map<String, Object>> turns = jdbc.queryForList("""
                SELECT question_slug, origin, depth, result FROM mock_turn WHERE session_id = ? AND seq = ?""", sessionId, seq);
        if (turns.isEmpty()) {
            throw new InterviewException(ErrorCode.NOT_FOUND);
        }
        Map<String, Object> turn = turns.get(0);
        String current = (String) turn.get("result");
        if (current != null) {
            if (current.equals(result.name())) {
                return view(userId, sessionId);
            }
            throw new InterviewException(ErrorCode.QUIZ_RESULT_CONFLICT);
        }
        if (session.get("finished_at") != null) {
            throw new InterviewException(ErrorCode.QUIZ_FINISHED);
        }

        Instant now = clock.instant();
        jdbc.update("UPDATE mock_turn SET result = ?, seconds = ?, answer_text = ?, answered_at = ? WHERE session_id = ? AND seq = ?",
                result.name(), seconds, answer, toOffset(now), sessionId, seq);
        Origin origin = Origin.valueOf((String) turn.get("origin"));
        String slug = (String) turn.get("question_slug");
        if (origin != Origin.AI_PROBE) {
            QuizService.recordStats(jdbc, userId, slug, result, now);
        }

        Set<String> used = new HashSet<>(jdbc.queryForList(
                "SELECT question_slug FROM mock_turn WHERE session_id = ? AND question_slug IS NOT NULL", String.class, sessionId));
        Map<String, List<String>> followups = linkMap("FOLLOWUP");
        Map<String, List<String>> prereqs = linkMap("PREREQ");
        Set<String> candidates = new HashSet<>();
        Optional.ofNullable(followups.get(slug)).ifPresent(candidates::addAll);
        Optional.ofNullable(prereqs.get(slug)).ifPresent(candidates::addAll);
        Optional<Next> next = MockPlanner.next(new Answered(seq, slug, origin, ((Number) turn.get("depth")).intValue()), result,
                mains((String) session.get("mains")), followups, prereqs, used, ((Number) session.get("max_depth")).intValue(),
                quiz.statsFor(userId, candidates), rng, now);
        if (next.isPresent()) {
            Integer last = jdbc.queryForObject("SELECT max(seq) FROM mock_turn WHERE session_id = ?", Integer.class, sessionId);
            insertTurn(sessionId, last + 1, next.get());
        } else {
            jdbc.update("UPDATE mock_session SET finished_at = ? WHERE id = ?", toOffset(now), sessionId);
        }
        return view(userId, sessionId);
    }

    /** 모의면접을 끝낸다(멱등). 묻고 있던 턴은 답하지 않은 채로 남는다. */
    @Transactional
    public SessionView finish(UUID userId, UUID sessionId) {
        int updated = jdbc.update("UPDATE mock_session SET finished_at = COALESCE(finished_at, ?) WHERE id = ? AND user_id = ?",
                toOffset(clock.instant()), sessionId, userId);
        if (updated == 0) {
            throw new InterviewException(ErrorCode.NOT_FOUND);
        }
        return view(userId, sessionId);
    }

    // ------------------------------------------------------------------ 내부

    private boolean exists(UUID sessionId) {
        return !jdbc.queryForList("SELECT 1 FROM mock_session WHERE id = ?", Integer.class, sessionId).isEmpty();
    }

    /** 질문 → 연결 대상(보이는 질문만, 카탈로그가 정한 순서). */
    private Map<String, List<String>> linkMap(String kind) {
        Map<String, List<String>> map = new LinkedHashMap<>();
        for (LinkEdge e : catalog.visibleLinks(kind)) {
            map.computeIfAbsent(e.fromSlug(), k -> new ArrayList<>()).add(e.toSlug());
        }
        return map;
    }

    /** 직전 모의면접의 본 질문(다시 뽑힐 가중치를 낮춘다). */
    private Set<String> previousMains(UUID userId) {
        return jdbc.queryForList("SELECT main_slugs::text FROM mock_session WHERE user_id = ? ORDER BY started_at DESC LIMIT 1", String.class, userId)
                .stream().findFirst().map(this::mains).map(HashSet::new).map(s -> (Set<String>) s).orElse(Set.of());
    }

    private List<String> mains(String jsonArray) {
        return List.of(json.readValue(jsonArray, String[].class));
    }

    private void insertTurn(UUID sessionId, int seq, Next next) {
        jdbc.update("INSERT INTO mock_turn (session_id, seq, parent_seq, depth, origin, question_slug) VALUES (?, ?, ?, ?, ?, ?)",
                sessionId, seq, next.parentSeq(), next.depth(), next.origin().name(), next.questionSlug());
    }

    private SessionView view(UUID userId, UUID sessionId) {
        List<SessionView> found = jdbc.query("""
                SELECT id, main_slugs::text AS mains, main_count, max_depth, include_unlearned, started_at, finished_at
                FROM mock_session WHERE id = ? AND user_id = ?""", (rs, n) -> new SessionView(
                rs.getObject("id", UUID.class), rs.getInt("main_count"), mains(rs.getString("mains")).size(), rs.getInt("max_depth"),
                rs.getBoolean("include_unlearned"), rs.getObject("started_at", OffsetDateTime.class).toInstant(),
                instant(rs.getObject("finished_at", OffsetDateTime.class)), List.of()), sessionId, userId);
        if (found.isEmpty()) {
            throw new InterviewException(ErrorCode.NOT_FOUND); // 없는 세션과 남의 세션을 구분하지 않는다
        }
        List<TurnView> turns = jdbc.query("""
                SELECT seq, parent_seq, depth, origin, question_slug, result, seconds, answer_text, answered_at
                FROM mock_turn WHERE session_id = ? ORDER BY seq""",
                (rs, n) -> new TurnView(rs.getInt("seq"), rs.getObject("parent_seq", Integer.class), rs.getInt("depth"),
                        Origin.valueOf(rs.getString("origin")), rs.getString("question_slug"),
                        rs.getString("result") == null ? null : Result.valueOf(rs.getString("result")),
                        rs.getObject("seconds", Integer.class), rs.getString("answer_text"), instant(rs.getObject("answered_at", OffsetDateTime.class))),
                sessionId);
        SessionView s = found.get(0);
        return new SessionView(s.sessionId(), s.mainCount(), s.plannedMains(), s.maxDepth(), s.includeUnlearned(), s.startedAt(), s.finishedAt(),
                List.copyOf(turns));
    }

    private String scopeJson(Scope scope) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("categories", scope.categories());
        map.put("topics", scope.topics());
        map.put("tiers", scope.tiers());
        return json.writeValueAsString(map);
    }

    private static Instant instant(OffsetDateTime at) {
        return at == null ? null : at.toInstant();
    }
}
