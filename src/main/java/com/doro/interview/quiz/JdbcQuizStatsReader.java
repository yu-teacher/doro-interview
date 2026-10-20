package com.doro.interview.quiz;

import com.doro.interview.quiz.read.QuizStatsReader;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.LinkedHashSet;
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
}
