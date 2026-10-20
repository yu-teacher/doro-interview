package com.doro.interview.quiz;

import com.doro.interview.catalog.CatalogReader;
import com.doro.interview.catalog.CatalogViews.QuestionView;
import com.doro.interview.common.exception.ErrorCode;
import com.doro.interview.common.exception.InterviewException;
import com.doro.interview.mine.read.MyQuestionReader;
import com.doro.interview.quiz.ai.AiProperties;
import com.doro.interview.quiz.ai.FeedbackProvider;
import com.doro.interview.quiz.ai.FeedbackProvider.Request;
import com.doro.interview.quiz.ai.FeedbackUnavailableException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * AI 피드백(docs/M6-PLAN.md). 문항마다 한 번만 만들고 저장한다(D1·D2): 같은 문항에 다시 부르면 저장본을 돌려주고 공급자를 부르지 않는다.
 * 한도(사용자·전체, 최근 24시간)는 서비스 전체를 한 줄로 세우는 advisory lock 안에서 센다(D7) — 동시에 눌러도 상한을 넘지 않는다.
 * 실패한 호출은 저장하지 않으므로 한도에 세지 않는다. 사용자 id 는 인자로 받고 남의 세션은 없는 것과 같다(404).
 */
@Service
public class QuizFeedbackService {

    public static final int MAX_ANSWER_LENGTH = 2000;
    static final int MAX_FEEDBACK_LENGTH = 1500;
    private static final long LOCK_KEY = 0x51464442L; // 임의의 고정 값(이 서비스 안의 AI 피드백 한도 잠금)

    public record Status(boolean enabled, int perUserPerDay, int remainingToday) {
    }

    public record Feedback(String text, boolean cached, int remainingToday) {
    }

    private final JdbcTemplate jdbc;
    private final CatalogReader catalog;
    private final MyQuestionReader mine;
    private final FeedbackProvider provider;
    private final AiProperties props;

    QuizFeedbackService(JdbcTemplate jdbc, CatalogReader catalog, MyQuestionReader mine, FeedbackProvider provider, AiProperties props) {
        this.jdbc = jdbc;
        this.catalog = catalog;
        this.mine = mine;
        this.provider = provider;
        this.props = props;
    }

    @Transactional(readOnly = true)
    public Status status(UUID userId) {
        boolean enabled = provider.available();
        return new Status(enabled, props.getPerUserPerDay(), enabled ? remaining(userId) : 0);
    }

    /** 세션의 문항별 저장된 피드백(문항 번호 → 글). 소유 확인은 호출하는 쪽이 이미 했다. */
    @Transactional(readOnly = true)
    public Map<Integer, String> forSession(UUID sessionId) {
        Map<Integer, String> out = new LinkedHashMap<>();
        jdbc.query("SELECT seq, feedback FROM quiz_feedback WHERE session_id = ? ORDER BY seq", rs -> {
            out.put(rs.getInt("seq"), rs.getString("feedback"));
        }, sessionId);
        return out;
    }

    @Transactional
    public Feedback feedback(UUID userId, UUID sessionId, int seq, String answerText) {
        if (answerText == null || answerText.indexOf('\u0000') >= 0) {
            throw new InterviewException(ErrorCode.INVALID_INPUT, "내 답을 입력해 주세요.");
        }
        String answer = answerText.replace("\r\n", "\n").replace('\r', '\n').strip();
        if (answer.isEmpty() || answer.codePointCount(0, answer.length()) > MAX_ANSWER_LENGTH) {
            throw new InterviewException(ErrorCode.INVALID_INPUT, "내 답은 1~" + MAX_ANSWER_LENGTH + "자여야 합니다.");
        }
        List<String> slugs = jdbc.queryForList("""
                SELECT i.question_slug FROM quiz_item i JOIN quiz_session s ON s.id = i.session_id
                WHERE s.id = ? AND s.user_id = ? AND i.seq = ?""", String.class, sessionId, userId, seq);
        if (slugs.isEmpty()) {
            throw new InterviewException(ErrorCode.NOT_FOUND);
        }
        // 저장본이 있으면 공급자를 부르지 않는다(꺼져 있어도 이미 받은 피드백은 돌려준다)
        Optional<String> stored = jdbc.queryForList("SELECT feedback FROM quiz_feedback WHERE session_id = ? AND seq = ?", String.class, sessionId, seq)
                .stream().findFirst();
        if (stored.isPresent()) {
            return new Feedback(stored.get(), true, provider.available() ? remaining(userId) : 0);
        }
        if (!provider.available()) {
            throw new InterviewException(ErrorCode.AI_UNAVAILABLE);
        }
        Request request = request(userId, slugs.get(0), answer);

        jdbc.query("SELECT pg_advisory_xact_lock(?)", rs -> {
        }, LOCK_KEY);
        // 잠금을 기다리는 동안 같은 문항이 저장됐을 수 있다
        stored = jdbc.queryForList("SELECT feedback FROM quiz_feedback WHERE session_id = ? AND seq = ?", String.class, sessionId, seq).stream().findFirst();
        if (stored.isPresent()) {
            return new Feedback(stored.get(), true, remaining(userId));
        }
        if (usedByUser(userId) >= props.getPerUserPerDay() || usedGlobally() >= props.getGlobalPerDay()) {
            throw new InterviewException(ErrorCode.AI_LIMIT);
        }
        String text;
        try {
            text = provider.feedback(request);
        } catch (FeedbackUnavailableException e) {
            throw new InterviewException(ErrorCode.AI_UNAVAILABLE);
        }
        // 공급자가 길게 줘도 저장·표시 상한(DB 제약 2,000자)을 넘기지 않는다
        if (text.length() > MAX_FEEDBACK_LENGTH) {
            text = text.substring(0, MAX_FEEDBACK_LENGTH);
        }
        jdbc.update("INSERT INTO quiz_feedback (session_id, seq, user_id, feedback, model) VALUES (?, ?, ?, ?, ?)",
                sessionId, seq, userId, text, provider.model());
        return new Feedback(text, false, remaining(userId));
    }

    /** 질문·모범 답변을 모은다: 공용 질문(보이는 것)이거나 내 질문. 닫힌 질문·비교할 답이 없는 내 질문은 막는다. */
    private Request request(UUID userId, String slug, String answer) {
        if (mine.exists(userId, slug)) {
            String reference = mine.answerText(userId, slug).orElse("").strip();
            String title = mine.headings(userId, List.of(slug)).get(slug).title();
            if (reference.isEmpty()) {
                throw new InterviewException(ErrorCode.INVALID_INPUT, "비교할 모범 답변이 없습니다. 내 질문에 답을 적어 두면 피드백을 받을 수 있습니다.");
            }
            return new Request(title, reference, answer);
        }
        QuestionView q = catalog.question(slug).orElseThrow(() -> new InterviewException(ErrorCode.NOT_FOUND));
        return new Request(q.title(), q.spokenAnswer(), answer);
    }

    private int remaining(UUID userId) {
        return Math.max(0, props.getPerUserPerDay() - usedByUser(userId));
    }

    private int usedByUser(UUID userId) {
        return jdbc.queryForObject("SELECT count(*) FROM quiz_feedback WHERE user_id = ? AND created_at > now() - interval '24 hours'", Integer.class, userId);
    }

    private int usedGlobally() {
        return jdbc.queryForObject("SELECT count(*) FROM quiz_feedback WHERE created_at > now() - interval '24 hours'", Integer.class);
    }
}
