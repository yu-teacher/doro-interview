package com.doro.interview.progress;

import com.doro.interview.progress.read.ProgressReader;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

@Repository
class JdbcProgressReader implements ProgressReader {

    private final JdbcTemplate jdbc;

    JdbcProgressReader(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Set<String> learnedAmong(UUID userId, Collection<String> questionSlugs) {
        if (questionSlugs.isEmpty()) {
            return Set.of();
        }
        Set<String> found = new LinkedHashSet<>();
        jdbc.query(con -> {
            var ps = con.prepareStatement("SELECT question_slug FROM user_progress WHERE user_id = ? AND question_slug = ANY (?)");
            ps.setObject(1, userId);
            ps.setArray(2, con.createArrayOf("varchar", questionSlugs.toArray()));
            return ps;
        }, rs -> {
            found.add(rs.getString(1));
        });
        return Set.copyOf(found);
    }

    @Override
    public Set<String> learnedSlugs(UUID userId) {
        return Set.copyOf(jdbc.queryForList("SELECT question_slug FROM user_progress WHERE user_id = ?", String.class, userId));
    }
}
