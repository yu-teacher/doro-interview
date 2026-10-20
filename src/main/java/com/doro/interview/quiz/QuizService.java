package com.doro.interview.quiz;

import com.doro.interview.catalog.CatalogReader;
import com.doro.interview.catalog.CatalogViews.QuestionIndexEntry;
import com.doro.interview.common.exception.ErrorCode;
import com.doro.interview.common.exception.InterviewException;
import com.doro.interview.mine.read.MyQuestionReader;
import com.doro.interview.mine.read.MyQuestionReader.PoolEntry;
import com.doro.interview.progress.read.ProgressReader;
import com.doro.interview.quiz.QuizPicker.Mode;
import com.doro.interview.quiz.QuizPicker.Stat;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.time.Clock;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.random.RandomGenerator;

/**
 * 랜덤 면접(docs/M3-PLAN.md). 사용자 id 는 항상 인자로 받는다(M2 D5). 풀은 **보이는 질문 ∩ 내 체크**(미학습 포함 옵션이면 보이는 질문 전부)이고,
 * 진도는 {@link ProgressReader}(읽기 전용)로만 읽는다 — 시험은 진도에 쓰지 않는다.
 * 세션은 클라이언트가 만든 UUID 로 시작하고 문제 순서를 시작할 때 전부 정한다(재시작·재전송은 같은 세션, M3 D1·D2).
 * 결과는 한 번 기록되면 고정이다(M3 D3): 같은 결과는 무시, 다른 결과는 409.
 */
@Service
public class QuizService {

    public static final int MIN_COUNT = 1;
    public static final int MAX_COUNT = 30;
    public static final int MAX_ANSWER_LENGTH = 2000;

    public enum Result { CORRECT, WRONG, SKIPPED }

    /** 범위: 비어 있는 목록은 "전부". */
    public record Scope(List<String> categories, List<String> topics, List<String> tiers) {
        public Scope {
            categories = categories == null ? List.of() : List.copyOf(categories);
            topics = topics == null ? List.of() : List.copyOf(topics);
            tiers = tiers == null ? List.of() : List.copyOf(tiers);
        }

        public static Scope all() {
            return new Scope(List.of(), List.of(), List.of());
        }

        /**
         * 내 질문(docs/M4-PLAN.md D6): 주제·카테고리를 고르지 않았으면(전부) 들어가고, 고른 경우에는 가짜 주제 {@code @mine} 를
         * 골랐을 때만 들어간다. 난이도 필터는 내 질문의 난이도에 그대로 적용한다.
         */
        boolean acceptsMine(PoolEntry e) {
            boolean placeOk = (categories.isEmpty() && topics.isEmpty()) || topics.contains(MyQuestionReader.PSEUDO_TOPIC);
            return placeOk && (tiers.isEmpty() || tiers.contains(e.tier()));
        }

        boolean accepts(QuestionIndexEntry e) {
            return (categories.isEmpty() || categories.contains(e.categorySlug()))
                    && (topics.isEmpty() || topics.contains(e.topicSlug()))
                    && (tiers.isEmpty() || tiers.contains(e.tier()));
        }
    }

    public record ItemView(int seq, String questionSlug, Result result, Integer seconds, String answerText, Instant answeredAt) {
    }

    public record SessionView(UUID sessionId, int plannedCount, boolean includeUnlearned, Mode mode, Instant startedAt, Instant finishedAt,
                              List<ItemView> items) {
    }

    private final JdbcTemplate jdbc;
    private final CatalogReader catalog;
    private final ProgressReader progress;
    private final MyQuestionReader mine;
    private final ObjectMapper json;
    private final RandomGenerator rng;
    private final Clock clock;

    @Autowired
    QuizService(JdbcTemplate jdbc, CatalogReader catalog, ProgressReader progress, MyQuestionReader mine, ObjectMapper json) {
        this(jdbc, catalog, progress, mine, json, RandomGenerator.getDefault(), Clock.systemUTC());
    }

    /** 시험용: 난수와 시계를 정한다. */
    QuizService(JdbcTemplate jdbc, CatalogReader catalog, ProgressReader progress, MyQuestionReader mine, ObjectMapper json, RandomGenerator rng, Clock clock) {
        this.jdbc = jdbc;
        this.catalog = catalog;
        this.progress = progress;
        this.mine = mine;
        this.json = json;
        this.rng = rng;
        this.clock = clock;
    }

    // ------------------------------------------------------------------ 시작

    /**
     * 시험을 시작한다. 같은 {@code sessionId} 로 다시 부르면 **같은 세션**을 돌려준다(다른 인자는 무시). 다른 사용자의 id 는 없는 것과 같다(404).
     * 풀이 비면 세션을 만들지 않고 {@link ErrorCode#QUIZ_POOL_EMPTY}.
     */
    @Transactional
    public SessionView start(UUID userId, UUID sessionId, Scope scope, boolean includeUnlearned, int count, Mode mode) {
        if (count < MIN_COUNT || count > MAX_COUNT) {
            throw new InterviewException(ErrorCode.INVALID_INPUT, "개수는 " + MIN_COUNT + "~" + MAX_COUNT + " 사이여야 합니다.");
        }
        Optional<UUID> existingOwner = ownerOf(sessionId);
        if (existingOwner.isPresent()) {
            return view(userId, sessionId);
        }

        Set<String> learned = includeUnlearned ? null : progress.learnedSlugs(userId);
        List<String> pool = new ArrayList<>(catalog.visibleQuestionIndex().stream()
                .filter(scope::accepts)
                .map(QuestionIndexEntry::slug)
                .filter(slug -> learned == null || learned.contains(slug))
                .toList());
        // 내 질문도 같은 규칙(체크한 것만, 미학습 포함이면 전부)으로 풀에 더한다
        mine.poolEntries(userId).stream()
                .filter(scope::acceptsMine)
                .map(PoolEntry::slug)
                .filter(slug -> learned == null || learned.contains(slug))
                .forEach(pool::add);
        if (pool.isEmpty()) {
            throw new InterviewException(ErrorCode.QUIZ_POOL_EMPTY);
        }

        Instant now = clock.instant();
        List<String> picked = QuizPicker.pick(pool, statsFor(userId, pool), previousSessionSlugs(userId), count, mode, rng, now);

        // 같은 id 로 동시에 시작해도 한 쪽만 만든다(다른 쪽은 커밋을 기다렸다가 같은 세션을 본다)
        int inserted = jdbc.update("""
                INSERT INTO quiz_session (id, user_id, scope, include_unlearned, planned_count, started_at)
                VALUES (?, ?, ?::jsonb, ?, ?, ?) ON CONFLICT (id) DO NOTHING""",
                sessionId, userId, scopeJson(scope, mode), includeUnlearned, picked.size(), toOffset(now));
        if (inserted > 0) {
            List<Object[]> rows = new ArrayList<>();
            for (int i = 0; i < picked.size(); i++) {
                rows.add(new Object[]{sessionId, i + 1, picked.get(i)});
            }
            jdbc.batchUpdate("INSERT INTO quiz_item (session_id, seq, question_slug) VALUES (?, ?, ?)", rows);
        }
        return view(userId, sessionId);
    }

    // ------------------------------------------------------------------ 조회

    @Transactional(readOnly = true)
    public SessionView get(UUID userId, UUID sessionId) {
        return view(userId, sessionId);
    }

    // ------------------------------------------------------------------ 결과 기록

    /**
     * 한 문항의 결과를 기록한다. 같은 결과를 다시 보내면 무시하고(통계를 두 번 올리지 않는다), 다른 결과는 409 다. 끝난 시험은 409.
     * 맞음·틀림은 같은 트랜잭션에서 통계에 반영하고, 건너뛰기는 기록만 남긴다(가중치에 영향 없음).
     */
    @Transactional
    public void record(UUID userId, UUID sessionId, int seq, Result result, Integer seconds, String answerText) {
        String answer = normalizeAnswer(answerText);
        if (seconds != null && (seconds < 0 || seconds > 86_400)) {
            throw new InterviewException(ErrorCode.INVALID_INPUT, "걸린 시간이 올바르지 않습니다.");
        }
        // 문항 행을 잠가서 같은 결과가 동시에 와도 통계는 한 번만 오른다
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT i.question_slug, i.result, s.finished_at
                FROM quiz_item i JOIN quiz_session s ON s.id = i.session_id
                WHERE i.session_id = ? AND i.seq = ? AND s.user_id = ? FOR UPDATE OF i""", sessionId, seq, userId);
        if (rows.isEmpty()) {
            throw new InterviewException(ErrorCode.NOT_FOUND);
        }
        Map<String, Object> row = rows.get(0);
        String current = (String) row.get("result");
        if (current != null) {
            if (current.equals(result.name())) {
                return;
            }
            throw new InterviewException(ErrorCode.QUIZ_RESULT_CONFLICT);
        }
        if (row.get("finished_at") != null) {
            throw new InterviewException(ErrorCode.QUIZ_FINISHED);
        }
        Instant now = clock.instant();
        jdbc.update("UPDATE quiz_item SET result = ?, seconds = ?, answer_text = ?, answered_at = ? WHERE session_id = ? AND seq = ?",
                result.name(), seconds, answer, toOffset(now), sessionId, seq);
        if (result != Result.SKIPPED) {
            boolean wrong = result == Result.WRONG;
            jdbc.update("""
                    INSERT INTO quiz_question_stats (user_id, question_slug, ask_count, miss_count, last_asked_at, last_result)
                    VALUES (?, ?, 1, ?, ?, ?)
                    ON CONFLICT (user_id, question_slug) DO UPDATE SET ask_count = quiz_question_stats.ask_count + 1,
                        miss_count = quiz_question_stats.miss_count + EXCLUDED.miss_count,
                        last_asked_at = EXCLUDED.last_asked_at, last_result = EXCLUDED.last_result""",
                    userId, row.get("question_slug"), wrong ? 1 : 0, toOffset(now), result.name());
        }
    }

    /** 시험을 끝낸다(멱등). 안 푼 문항은 그대로 비어 있다. */
    @Transactional
    public void finish(UUID userId, UUID sessionId) {
        int updated = jdbc.update("UPDATE quiz_session SET finished_at = COALESCE(finished_at, ?) WHERE id = ? AND user_id = ?",
                toOffset(clock.instant()), sessionId, userId);
        if (updated == 0) {
            throw new InterviewException(ErrorCode.NOT_FOUND);
        }
    }

    // ------------------------------------------------------------------ 현황·설정

    /** 많이 틀린 질문 한 줄. */
    public record MissedQuestion(String questionSlug, int missCount, int askCount) {
    }

    /** 최근 30일의 출제 현황(맞음·틀림·건너뜀은 문항 단위, 세션 수는 시작한 시험 수)과 자주 틀린 질문. */
    public record Stats(int askedLast30Days, int correctLast30Days, int wrongLast30Days, int skippedLast30Days, int sessionsLast30Days,
                        List<MissedQuestion> mostMissed) {
    }

    public static final int MOST_MISSED_LIMIT = 10;

    @Transactional(readOnly = true)
    public Stats stats(UUID userId) {
        OffsetDateTime since = toOffset(clock.instant().minus(java.time.Duration.ofDays(30)));
        int[] counts = new int[3]; // correct, wrong, skipped
        jdbc.query("""
                SELECT i.result, count(*) AS n FROM quiz_item i JOIN quiz_session s ON s.id = i.session_id
                WHERE s.user_id = ? AND i.result IS NOT NULL AND i.answered_at >= ? GROUP BY i.result""", rs -> {
            int n = rs.getInt("n");
            switch (rs.getString("result")) {
                case "CORRECT" -> counts[0] = n;
                case "WRONG" -> counts[1] = n;
                default -> counts[2] = n;
            }
        }, userId, since);
        int sessions = jdbc.queryForObject("SELECT count(*) FROM quiz_session WHERE user_id = ? AND started_at >= ?", Integer.class, userId, since);
        List<MissedQuestion> missed = jdbc.query("""
                SELECT question_slug, miss_count, ask_count FROM quiz_question_stats WHERE user_id = ? AND miss_count > 0
                ORDER BY miss_count DESC, last_asked_at DESC, question_slug LIMIT ?""",
                (rs, n) -> new MissedQuestion(rs.getString("question_slug"), rs.getInt("miss_count"), rs.getInt("ask_count")), userId, MOST_MISSED_LIMIT);
        return new Stats(counts[0] + counts[1], counts[0], counts[1], counts[2], sessions, List.copyOf(missed));
    }

    /** "미학습 포함" 의 기본값(설정이 없으면 꺼짐). */
    @Transactional(readOnly = true)
    public boolean includeUnlearnedDefault(UUID userId) {
        return jdbc.queryForList("SELECT include_unlearned_default FROM user_pref WHERE user_id = ?", Boolean.class, userId).stream().findFirst().orElse(false);
    }

    @Transactional
    public void setIncludeUnlearnedDefault(UUID userId, boolean value) {
        jdbc.update("""
                INSERT INTO user_pref (user_id, include_unlearned_default) VALUES (?, ?)
                ON CONFLICT (user_id) DO UPDATE SET include_unlearned_default = EXCLUDED.include_unlearned_default""", userId, value);
    }

    // ------------------------------------------------------------------ 내부

    private Optional<UUID> ownerOf(UUID sessionId) {
        return jdbc.queryForList("SELECT user_id FROM quiz_session WHERE id = ?", UUID.class, sessionId).stream().findFirst();
    }

    private SessionView view(UUID userId, UUID sessionId) {
        List<SessionView> found = jdbc.query("""
                SELECT id, planned_count, include_unlearned, scope->>'mode' AS mode, started_at, finished_at
                FROM quiz_session WHERE id = ? AND user_id = ?""", (rs, n) -> new SessionView(
                rs.getObject("id", UUID.class), rs.getInt("planned_count"), rs.getBoolean("include_unlearned"),
                "RANDOM".equals(rs.getString("mode")) ? Mode.RANDOM : Mode.WEIGHTED,
                rs.getObject("started_at", OffsetDateTime.class).toInstant(),
                rs.getObject("finished_at", OffsetDateTime.class) == null ? null : rs.getObject("finished_at", OffsetDateTime.class).toInstant(),
                List.of()), sessionId, userId);
        if (found.isEmpty()) {
            throw new InterviewException(ErrorCode.NOT_FOUND); // 없는 세션과 남의 세션을 구분하지 않는다
        }
        List<ItemView> items = jdbc.query("""
                SELECT seq, question_slug, result, seconds, answer_text, answered_at FROM quiz_item WHERE session_id = ? ORDER BY seq""",
                (rs, n) -> new ItemView(rs.getInt("seq"), rs.getString("question_slug"),
                        rs.getString("result") == null ? null : Result.valueOf(rs.getString("result")),
                        rs.getObject("seconds", Integer.class), rs.getString("answer_text"),
                        rs.getObject("answered_at", OffsetDateTime.class) == null ? null : rs.getObject("answered_at", OffsetDateTime.class).toInstant()),
                sessionId);
        SessionView s = found.get(0);
        return new SessionView(s.sessionId(), s.plannedCount(), s.includeUnlearned(), s.mode(), s.startedAt(), s.finishedAt(), List.copyOf(items));
    }

    private Map<String, Stat> statsFor(UUID userId, List<String> pool) {
        Map<String, Stat> stats = new HashMap<>();
        Set<String> inPool = new HashSet<>(pool);
        jdbc.query("SELECT question_slug, ask_count, miss_count, last_asked_at FROM quiz_question_stats WHERE user_id = ?", rs -> {
            String slug = rs.getString("question_slug");
            if (inPool.contains(slug)) {
                OffsetDateTime at = rs.getObject("last_asked_at", OffsetDateTime.class);
                stats.put(slug, new Stat(rs.getInt("ask_count"), rs.getInt("miss_count"), at == null ? null : at.toInstant()));
            }
        }, userId);
        return stats;
    }

    /** 직전 세션(가장 최근에 시작한 세션)에서 나온 질문. */
    private Set<String> previousSessionSlugs(UUID userId) {
        return new HashSet<>(jdbc.queryForList("""
                SELECT i.question_slug FROM quiz_item i
                WHERE i.session_id = (SELECT id FROM quiz_session WHERE user_id = ? ORDER BY started_at DESC LIMIT 1)""",
                String.class, userId));
    }

    private String scopeJson(Scope scope, Mode mode) {
        Map<String, Object> map = new java.util.LinkedHashMap<>();
        map.put("categories", scope.categories());
        map.put("topics", scope.topics());
        map.put("tiers", scope.tiers());
        map.put("mode", mode.name());
        return json.writeValueAsString(map);
    }

    private static OffsetDateTime toOffset(Instant instant) {
        return OffsetDateTime.ofInstant(instant, ZoneOffset.UTC);
    }

    /** 공백뿐인 답은 "답 없음"(null)이다. NUL(PostgreSQL TEXT 가 못 담는다)과 길이 초과는 400. */
    private static String normalizeAnswer(String text) {
        if (text == null) {
            return null;
        }
        if (text.indexOf('\u0000') >= 0) {
            throw new InterviewException(ErrorCode.INVALID_INPUT, "답에 쓸 수 없는 문자가 있습니다.");
        }
        String normalized = text.replace("\r\n", "\n").replace('\r', '\n');
        if (normalized.codePointCount(0, normalized.length()) > MAX_ANSWER_LENGTH) {
            throw new InterviewException(ErrorCode.INVALID_INPUT, "답은 " + MAX_ANSWER_LENGTH + "자까지 쓸 수 있습니다.");
        }
        return normalized.isBlank() ? null : normalized;
    }
}
