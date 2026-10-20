package com.doro.interview.mine;

import com.doro.interview.common.exception.ErrorCode;
import com.doro.interview.common.exception.InterviewException;
import com.doro.interview.mine.read.MyQuestionDeleted;
import com.doro.interview.mine.read.MyQuestionReader;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Array;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * 내 질문(사용자 한 명만 보는 질문, docs/M4-PLAN.md). 사용자 id 는 인자로 받는다(M2 D5): 남의 질문을 읽거나 고칠 길이 시그니처에
 * 드러나지 않는다. 모든 글은 일반 텍스트로만 저장한다(보여 주는 쪽이 텍스트로만 그린다). 남의 id 는 없는 것과 같다(404).
 */
@Service
public class MyQuestionService {

    public static final int MAX_PER_USER = 300;
    public static final int MAX_BATCH = 50;
    public static final int MAX_TITLE = 200;
    public static final int MAX_ANSWER = 4000;
    public static final int MAX_KEYWORDS = 10;
    public static final int MAX_KEYWORD = 40;
    public static final int MAX_SOURCE = 40;
    public static final Set<String> TIERS = Set.of("BASIC", "DEEP", "TRICKY");

    private final JdbcTemplate jdbc;
    private final ApplicationEventPublisher events;

    MyQuestionService(JdbcTemplate jdbc, ApplicationEventPublisher events) {
        this.jdbc = jdbc;
        this.events = events;
    }

    /** 입력. 검증·정리는 {@link #normalize} 가 한다. */
    public record Draft(String title, String answerText, List<String> keywords, String tier, String sourceLabel) {
    }

    public record BatchItem(UUID id, Draft draft) {
    }

    public record Question(UUID id, String slug, String title, String answerText, List<String> keywords, String tier,
                           String sourceLabel, Instant createdAt, Instant updatedAt) {
    }

    @Transactional(readOnly = true)
    public List<Question> list(UUID userId) {
        return jdbc.query(SELECT + " WHERE user_id = ? ORDER BY created_at, id", MAPPER, userId);
    }

    @Transactional(readOnly = true)
    public Optional<Question> get(UUID userId, UUID id) {
        return jdbc.query(SELECT + " WHERE user_id = ? AND id = ?", MAPPER, userId, id).stream().findFirst();
    }

    /** 만들거나(같은 id 가 없으면) 통째로 바꾼다(있으면). 같은 요청을 다시 보내도 결과가 같다. */
    @Transactional
    public Question put(UUID userId, UUID id, Draft draft) {
        return putAll(userId, List.of(new BatchItem(id, draft))).get(0);
    }

    /** 최대 {@value #MAX_BATCH}개. 하나라도 거절되면 전부 저장하지 않는다. */
    @Transactional
    public List<Question> putAll(UUID userId, List<BatchItem> items) {
        if (items.isEmpty() || items.size() > MAX_BATCH) {
            throw new InterviewException(ErrorCode.INVALID_INPUT, "한 번에 1~" + MAX_BATCH + "개까지 저장할 수 있습니다.");
        }
        Set<UUID> ids = new LinkedHashSet<>();
        for (BatchItem item : items) {
            if (!ids.add(item.id())) {
                throw new InterviewException(ErrorCode.INVALID_INPUT, "같은 id 가 두 번 들어 있습니다.");
            }
        }
        List<Draft> clean = items.stream().map(i -> normalize(i.draft())).toList();

        // 사용자별로 한 줄로 세운다: 동시에 만들어도 상한을 넘지 않는다
        jdbc.query("SELECT pg_advisory_xact_lock(hashtextextended(?, 0))", rs -> {
        }, "my_question:" + userId);
        int mine = count(userId);
        int fresh = 0;
        for (UUID id : ids) {
            if (!owned(userId, id)) {
                fresh++;
            }
        }
        if (mine + fresh > MAX_PER_USER) {
            throw new InterviewException(ErrorCode.MINE_LIMIT);
        }

        List<Question> saved = new ArrayList<>();
        int i = 0;
        for (BatchItem item : items) {
            Draft d = clean.get(i++);
            // 남의 id 면 갱신되지 않고(WHERE) 0행 → 404. 내 id 면 통째로 바꾼다.
            int rows = jdbc.update(con -> {
                var ps = con.prepareStatement("""
                        INSERT INTO my_question (id, user_id, title, answer_text, keywords, tier, source_label)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, answer_text = EXCLUDED.answer_text,
                            keywords = EXCLUDED.keywords, tier = EXCLUDED.tier, source_label = EXCLUDED.source_label, updated_at = now()
                        WHERE my_question.user_id = EXCLUDED.user_id""");
                ps.setObject(1, item.id());
                ps.setObject(2, userId);
                ps.setString(3, d.title());
                ps.setString(4, d.answerText());
                Array keywords = con.createArrayOf("text", d.keywords().toArray());
                ps.setArray(5, keywords);
                ps.setString(6, d.tier());
                ps.setString(7, d.sourceLabel());
                return ps;
            });
            if (rows == 0) {
                throw new InterviewException(ErrorCode.NOT_FOUND);
            }
            saved.add(get(userId, item.id()).orElseThrow());
        }
        return saved;
    }

    /** 내 질문을 지운다. 없거나 남의 것이면 false(404). 체크·통계 정리는 이벤트로 같은 트랜잭션에서 한다. */
    @Transactional
    public boolean delete(UUID userId, UUID id) {
        int rows = jdbc.update("DELETE FROM my_question WHERE user_id = ? AND id = ?", userId, id);
        if (rows == 0) {
            return false;
        }
        events.publishEvent(new MyQuestionDeleted(userId, MyQuestionReader.SLUG_PREFIX + id));
        return true;
    }

    static Draft normalize(Draft in) {
        String title = clean("제목", in.title()).strip();
        if (title.isEmpty() || title.codePointCount(0, title.length()) > MAX_TITLE) {
            throw invalid("제목은 1~" + MAX_TITLE + "자여야 합니다.");
        }
        String answer = newlines(clean("답", in.answerText() == null ? "" : in.answerText()));
        if (answer.codePointCount(0, answer.length()) > MAX_ANSWER) {
            throw invalid("답은 " + MAX_ANSWER + "자까지 쓸 수 있습니다.");
        }
        List<String> keywords = new ArrayList<>();
        Set<String> seen = new LinkedHashSet<>();
        for (String raw : in.keywords() == null ? List.<String>of() : in.keywords()) {
            String k = clean("키워드", raw).strip();
            if (k.isEmpty() || k.codePointCount(0, k.length()) > MAX_KEYWORD) {
                throw invalid("키워드는 1~" + MAX_KEYWORD + "자여야 합니다.");
            }
            if (seen.add(k)) {
                keywords.add(k);
            }
        }
        if (keywords.size() > MAX_KEYWORDS) {
            throw invalid("키워드는 " + MAX_KEYWORDS + "개까지 넣을 수 있습니다.");
        }
        String tier = in.tier() == null ? "BASIC" : in.tier();
        if (!TIERS.contains(tier)) {
            throw invalid("난이도는 BASIC, DEEP, TRICKY 중 하나여야 합니다.");
        }
        String source = null;
        if (in.sourceLabel() != null) {
            String s = clean("출처 표시", in.sourceLabel()).strip();
            if (s.codePointCount(0, s.length()) > MAX_SOURCE) {
                throw invalid("출처 표시는 " + MAX_SOURCE + "자까지 쓸 수 있습니다.");
            }
            source = s.isEmpty() ? null : s;
        }
        return new Draft(title, answer, List.copyOf(keywords), tier, source);
    }

    private static String clean(String field, String value) {
        if (value == null || value.indexOf('\u0000') >= 0) {
            throw invalid(field + "에 쓸 수 없는 문자가 있습니다.");
        }
        return value;
    }

    private static String newlines(String s) {
        return s.replace("\r\n", "\n").replace('\r', '\n');
    }

    private static InterviewException invalid(String message) {
        return new InterviewException(ErrorCode.INVALID_INPUT, message);
    }

    private int count(UUID userId) {
        return jdbc.queryForObject("SELECT count(*) FROM my_question WHERE user_id = ?", Integer.class, userId);
    }

    private boolean owned(UUID userId, UUID id) {
        return Boolean.TRUE.equals(jdbc.queryForObject("SELECT EXISTS (SELECT 1 FROM my_question WHERE id = ? AND user_id = ?)", Boolean.class, id, userId));
    }

    private static final String SELECT = "SELECT id, title, answer_text, keywords, tier, source_label, created_at, updated_at FROM my_question";

    private static final org.springframework.jdbc.core.RowMapper<Question> MAPPER = (rs, n) -> {
        UUID id = rs.getObject("id", UUID.class);
        String[] keywords = (String[]) rs.getArray("keywords").getArray();
        return new Question(id, MyQuestionReader.SLUG_PREFIX + id, rs.getString("title"), rs.getString("answer_text"),
                List.of(keywords), rs.getString("tier"), rs.getString("source_label"),
                rs.getObject("created_at", OffsetDateTime.class).toInstant(), rs.getObject("updated_at", OffsetDateTime.class).toInstant());
    };
}
