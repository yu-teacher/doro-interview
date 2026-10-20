package com.doro.interview.mine;

import com.doro.interview.mine.read.MyQuestionReader;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Repository
class JdbcMyQuestionReader implements MyQuestionReader {

    private final JdbcTemplate jdbc;

    JdbcMyQuestionReader(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** slug 에서 id 를 꺼낸다. 형식이 아니면 null(= 내 질문이 아니다). */
    static UUID idOf(String slug) {
        if (slug == null || !slug.startsWith(SLUG_PREFIX) || slug.length() != SLUG_PREFIX.length() + 36) {
            return null;
        }
        try {
            UUID id = UUID.fromString(slug.substring(SLUG_PREFIX.length()));
            return id.toString().equals(slug.substring(SLUG_PREFIX.length())) ? id : null;
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    @Override
    public boolean exists(UUID userId, String slug) {
        UUID id = idOf(slug);
        return id != null && Boolean.TRUE.equals(jdbc.queryForObject(
                "SELECT EXISTS (SELECT 1 FROM my_question WHERE id = ? AND user_id = ?)", Boolean.class, id, userId));
    }

    @Override
    public java.util.Optional<String> answerText(UUID userId, String slug) {
        UUID id = idOf(slug);
        if (id == null) {
            return java.util.Optional.empty();
        }
        return jdbc.queryForList("SELECT answer_text FROM my_question WHERE id = ? AND user_id = ?", String.class, id, userId).stream().findFirst();
    }

    @Override
    public List<PoolEntry> poolEntries(UUID userId) {
        return jdbc.query("SELECT id, tier FROM my_question WHERE user_id = ? ORDER BY created_at, id",
                (rs, n) -> new PoolEntry(SLUG_PREFIX + rs.getObject("id", UUID.class), rs.getString("tier")), userId);
    }

    @Override
    public Map<String, Heading> headings(UUID userId, Collection<String> slugs) {
        Set<UUID> ids = new LinkedHashSet<>();
        for (String slug : slugs) {
            UUID id = idOf(slug);
            if (id != null) {
                ids.add(id);
            }
        }
        Map<String, Heading> out = new LinkedHashMap<>();
        if (ids.isEmpty()) {
            return out;
        }
        jdbc.query(con -> {
            var ps = con.prepareStatement("SELECT id, title, tier FROM my_question WHERE user_id = ? AND id = ANY (?)");
            ps.setObject(1, userId);
            ps.setArray(2, con.createArrayOf("uuid", ids.toArray()));
            return ps;
        }, rs -> {
            String slug = SLUG_PREFIX + rs.getObject("id", UUID.class);
            out.put(slug, new Heading(slug, rs.getString("title"), rs.getString("tier")));
        });
        return out;
    }
}
