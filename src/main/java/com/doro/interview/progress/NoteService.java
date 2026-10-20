package com.doro.interview.progress;

import com.doro.interview.catalog.CatalogReader;
import com.doro.interview.common.exception.ErrorCode;
import com.doro.interview.common.exception.InterviewException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 질문별 내 노트(일반 텍스트). 사용자 id 는 인자로 받는다(D5). 질문이 보이지 않으면 없는 것과 같은 404 다.
 * 저장은 덮어쓰기이고, 공백뿐인 본문은 노트를 지운다(빈 노트는 행을 두지 않는다). HTML 은 가공하지 않고 그대로 저장한다
 * (보여 주는 쪽이 텍스트로만 그린다).
 */
@Service
public class NoteService {

    /** 노트 길이 상한(유니코드 코드포인트 기준, 이모지 하나는 1). */
    public static final int MAX_LENGTH = 2000;

    private final JdbcTemplate jdbc;
    private final CatalogReader catalog;

    NoteService(JdbcTemplate jdbc, CatalogReader catalog) {
        this.jdbc = jdbc;
        this.catalog = catalog;
    }

    public record Note(String slug, String body, Instant updatedAt) {
    }

    @Transactional(readOnly = true)
    public Optional<Note> get(UUID userId, String questionSlug) {
        requireVisible(questionSlug);
        return find(userId, questionSlug);
    }

    /**
     * 노트를 저장하고 저장된 노트를 돌려준다(지웠으면 비어 있음). NUL 문자(PostgreSQL TEXT 가 담지 못한다)와 상한 초과는 400 이다.
     * 줄바꿈은 {@code \n} 으로 통일하고 앞뒤 공백은 그대로 둔다.
     */
    @Transactional
    public Optional<Note> put(UUID userId, String questionSlug, String body) {
        requireVisible(questionSlug);
        if (body.indexOf('\u0000') >= 0) {
            throw new InterviewException(ErrorCode.INVALID_INPUT, "노트에 쓸 수 없는 문자가 있습니다.");
        }
        String normalized = body.replace("\r\n", "\n").replace('\r', '\n');
        if (normalized.codePointCount(0, normalized.length()) > MAX_LENGTH) {
            throw new InterviewException(ErrorCode.INVALID_INPUT, "노트는 " + MAX_LENGTH + "자까지 쓸 수 있습니다.");
        }
        if (normalized.isBlank()) {
            jdbc.update("DELETE FROM my_note WHERE user_id = ? AND question_slug = ?", userId, questionSlug);
            return Optional.empty();
        }
        jdbc.update("""
                INSERT INTO my_note (user_id, question_slug, body) VALUES (?, ?, ?)
                ON CONFLICT (user_id, question_slug) DO UPDATE SET body = EXCLUDED.body, updated_at = now()""",
                userId, questionSlug, normalized);
        return find(userId, questionSlug);
    }

    private Optional<Note> find(UUID userId, String questionSlug) {
        List<Note> found = jdbc.query("SELECT question_slug, body, updated_at FROM my_note WHERE user_id = ? AND question_slug = ?",
                (rs, n) -> new Note(rs.getString("question_slug"), rs.getString("body"),
                        rs.getObject("updated_at", OffsetDateTime.class).toInstant()), userId, questionSlug);
        return found.stream().findFirst();
    }

    private void requireVisible(String questionSlug) {
        if (!catalog.isVisibleQuestion(questionSlug)) {
            throw new InterviewException(ErrorCode.NOT_FOUND);
        }
    }
}
