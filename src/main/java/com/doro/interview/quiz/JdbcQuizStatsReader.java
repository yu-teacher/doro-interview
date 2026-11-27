package com.doro.interview.quiz;

import com.doro.interview.quiz.read.QuizStatsReader;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Repository
class JdbcQuizStatsReader implements QuizStatsReader {

    private final JdbcTemplate jdbc;

    JdbcQuizStatsReader(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Set<String> lastWrongAmong(UUID userId, Collection<String> questionSlugs) {
        if (questionSlugs.isEmpty()) {
            return Set.of();
        }
        Set<String> found = new LinkedHashSet<>();
        jdbc.query(con -> {
            var ps = con.prepareStatement("SELECT question_slug FROM quiz_question_stats WHERE user_id = ? AND last_result = 'WRONG' AND question_slug = ANY (?)");
            ps.setObject(1, userId);
            ps.setArray(2, con.createArrayOf("varchar", questionSlugs.toArray()));
            return ps;
        }, rs -> {
            found.add(rs.getString(1));
        });
        return Set.copyOf(found);
    }

    @Override
    public Set<String> lastWrong(UUID userId) {
        return Set.copyOf(jdbc.queryForList("SELECT question_slug FROM quiz_question_stats WHERE user_id = ? AND last_result = 'WRONG'", String.class, userId));
    }

    @Override
    public Map<UUID, Set<String>> lastWrongAskedBetween(Instant from, Instant to) {
        Map<UUID, Set<String>> found = new HashMap<>();
        jdbc.query("""
                SELECT user_id, question_slug FROM quiz_question_stats
                WHERE last_result = 'WRONG' AND last_asked_at >= ? AND last_asked_at < ?""", rs -> {
            found.computeIfAbsent(rs.getObject(1, UUID.class), k -> new LinkedHashSet<>()).add(rs.getString(2));
        }, OffsetDateTime.ofInstant(from, ZoneOffset.UTC), OffsetDateTime.ofInstant(to, ZoneOffset.UTC));
        Map<UUID, Set<String>> out = new HashMap<>();
        found.forEach((user, slugs) -> out.put(user, Set.copyOf(slugs)));
        return out;
    }
}
