package com.doro.interview.catalog;

import com.doro.interview.catalog.CatalogViews.CategoryView;
import com.doro.interview.catalog.CatalogViews.ConceptDetail;
import com.doro.interview.catalog.CatalogViews.ConceptRef;
import com.doro.interview.catalog.CatalogViews.ConceptView;
import com.doro.interview.catalog.CatalogViews.QuestionRef;
import com.doro.interview.catalog.CatalogViews.QuestionSummary;
import com.doro.interview.catalog.CatalogViews.QuestionView;
import com.doro.interview.catalog.CatalogViews.SourceView;
import com.doro.interview.catalog.CatalogViews.TierCounts;
import com.doro.interview.catalog.CatalogViews.TopicSummary;
import com.doro.interview.catalog.CatalogViews.TopicView;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Array;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class JdbcCatalogReader implements CatalogReader {

    /** 질문 정렬: tier(BASIC → DEEP → TRICKY), 질문 번호, slug. */
    private static final String QUESTION_ORDER = "CASE q.tier WHEN 'BASIC' THEN 1 WHEN 'DEEP' THEN 2 ELSE 3 END, q.sort, q.slug";

    private static final String TOPIC_SOURCES = """
            ARRAY(SELECT e->>'url'  FROM jsonb_array_elements(t.sources) WITH ORDINALITY x(e, i) ORDER BY i) AS source_urls,
            ARRAY(SELECT e->>'note' FROM jsonb_array_elements(t.sources) WITH ORDINALITY x(e, i) ORDER BY i) AS source_notes""";

    /** 질문 요약 컬럼(별칭 q). 개념은 사전 순서의 slug 배열이다. */
    private static final String SUMMARY_COLUMNS = """
            q.slug, q.topic_slug, q.tier, q.difficulty, q.title, q.keywords, q.has_extra, q.importance,
            ARRAY(SELECT qc.concept_slug FROM question_concept qc JOIN concept c ON c.slug = qc.concept_slug
                  WHERE qc.question_id = q.id ORDER BY c.sort, c.slug) AS concept_slugs""";

    private final JdbcTemplate jdbc;
    private final CatalogVisibility visibility;

    public JdbcCatalogReader(JdbcTemplate jdbc, CatalogVisibility visibility) {
        this.jdbc = jdbc;
        this.visibility = visibility;
    }

    // ------------------------------------------------------------------ 카테고리·주제

    @Override
    public List<CategoryView> categories() {
        String sql = """
                SELECT c.slug AS category_slug, c.name AS category_name,
                       t.slug AS topic_slug, t.name AS topic_name, t.description, t.base_version,
                       COUNT(q.id) FILTER (WHERE q.tier = 'BASIC')  AS basic,
                       COUNT(q.id) FILTER (WHERE q.tier = 'DEEP')   AS deep,
                       COUNT(q.id) FILTER (WHERE q.tier = 'TRICKY') AS tricky
                FROM category c
                JOIN topic t ON t.category_slug = c.slug AND %s
                LEFT JOIN question q ON q.topic_slug = t.slug AND q.retired_at IS NULL
                GROUP BY c.slug, c.name, c.sort, t.slug, t.name, t.description, t.base_version, t.sort
                ORDER BY c.sort, c.slug, t.sort, t.slug
                """.formatted(visibility.topicVisible("t"));
        Map<String, String> names = new LinkedHashMap<>();
        Map<String, List<TopicSummary>> topics = new LinkedHashMap<>();
        jdbc.query(sql, rs -> {
            String slug = rs.getString("category_slug");
            names.putIfAbsent(slug, rs.getString("category_name"));
            topics.computeIfAbsent(slug, k -> new ArrayList<>()).add(topicSummary(rs));
        });
        List<CategoryView> result = new ArrayList<>();
        topics.forEach((slug, list) -> result.add(new CategoryView(slug, names.get(slug), List.copyOf(list))));
        return List.copyOf(result);
    }

    @Override
    public Optional<TopicView> topic(String slug) {
        String sql = """
                SELECT c.slug AS category_slug, c.name AS category_name,
                       t.slug AS topic_slug, t.name AS topic_name, t.description, t.base_version,
                       (SELECT COUNT(*) FROM question q WHERE q.topic_slug = t.slug AND q.retired_at IS NULL AND q.tier = 'BASIC')  AS basic,
                       (SELECT COUNT(*) FROM question q WHERE q.topic_slug = t.slug AND q.retired_at IS NULL AND q.tier = 'DEEP')   AS deep,
                       (SELECT COUNT(*) FROM question q WHERE q.topic_slug = t.slug AND q.retired_at IS NULL AND q.tier = 'TRICKY') AS tricky,
                       %s
                FROM topic t JOIN category c ON c.slug = t.category_slug
                WHERE t.slug = ? AND %s
                """.formatted(TOPIC_SOURCES, visibility.topicVisible("t"));
        List<TopicView> found = jdbc.query(sql, (rs, n) -> new TopicView(topicSummary(rs), rs.getString("category_slug"),
                rs.getString("category_name"), sources(rs), List.of()), slug);
        if (found.isEmpty()) {
            return Optional.empty();
        }
        TopicView head = found.get(0);
        String questionsSql = """
                SELECT %s
                FROM question q JOIN topic t ON t.slug = q.topic_slug
                WHERE t.slug = ? AND %s
                ORDER BY %s
                """.formatted(SUMMARY_COLUMNS, visibility.questionVisible("q", "t"), QUESTION_ORDER);
        List<QuestionSummary> questions = jdbc.query(questionsSql, (rs, n) -> summary(rs), slug);
        return Optional.of(new TopicView(head.summary(), head.categorySlug(), head.categoryName(), head.sources(), List.copyOf(questions)));
    }

    // ------------------------------------------------------------------ 질문

    @Override
    public Optional<QuestionView> question(String slug) {
        String sql = """
                SELECT q.slug, q.topic_slug, t.name AS topic_name, t.category_slug, t.base_version, q.tier, q.difficulty, q.title,
                       q.keywords, q.has_extra, q.answer_md, q.status, q.reviewed_at, q.needs_review, q.content_hash, q.importance,
                       ARRAY(SELECT s FROM jsonb_array_elements_text(q.sources) WITH ORDINALITY x(s, i) ORDER BY i) AS own_sources,
                       ARRAY(SELECT c.slug FROM question_concept qc JOIN concept c ON c.slug = qc.concept_slug
                             WHERE qc.question_id = q.id ORDER BY c.sort, c.slug) AS concept_slugs,
                       ARRAY(SELECT c.name FROM question_concept qc JOIN concept c ON c.slug = qc.concept_slug
                             WHERE qc.question_id = q.id ORDER BY c.sort, c.slug) AS concept_names,
                       %s
                FROM question q JOIN topic t ON t.slug = q.topic_slug
                WHERE q.slug = ? AND %s
                """.formatted(TOPIC_SOURCES, visibility.questionVisible("q", "t"));
        List<QuestionView> found = jdbc.query(sql, (rs, n) -> {
            AnswerSplitter.Split split = AnswerSplitter.split(rs.getString("answer_md"));
            var reviewed = rs.getObject("reviewed_at", java.time.OffsetDateTime.class);
            List<String> conceptSlugs = textArray(rs.getArray("concept_slugs"));
            List<String> conceptNames = textArray(rs.getArray("concept_names"));
            List<ConceptRef> concepts = new ArrayList<>();
            for (int i = 0; i < conceptSlugs.size(); i++) {
                concepts.add(new ConceptRef(conceptSlugs.get(i), conceptNames.get(i)));
            }
            Integer importance = rs.getObject("importance", Integer.class);
            return new QuestionView(rs.getString("slug"), rs.getString("topic_slug"), rs.getString("topic_name"),
                    rs.getString("category_slug"), rs.getString("tier"), rs.getInt("difficulty"), rs.getString("title"),
                    textArray(rs.getArray("keywords")), rs.getBoolean("has_extra"), split.spokenAnswer(), split.detailMd(),
                    rs.getString("status"), reviewed == null ? null : reviewed.toInstant(), rs.getBoolean("needs_review"),
                    rs.getString("base_version"), textArray(rs.getArray("own_sources")), sources(rs), null, null,
                    rs.getString("content_hash"), importance, List.copyOf(concepts), List.of(), List.of(), List.of());
        }, slug);
        if (found.isEmpty()) {
            return Optional.empty();
        }
        QuestionView q = found.get(0);
        // 같은 주제 안에서 보이는 질문 순서로 이전/다음을 정한다
        List<String> order = jdbc.queryForList("""
                SELECT q.slug FROM question q JOIN topic t ON t.slug = q.topic_slug
                WHERE t.slug = ? AND %s ORDER BY %s
                """.formatted(visibility.questionVisible("q", "t"), QUESTION_ORDER), String.class, q.topicSlug());
        int idx = order.indexOf(q.slug());
        String prev = idx > 0 ? order.get(idx - 1) : null;
        String next = idx >= 0 && idx < order.size() - 1 ? order.get(idx + 1) : null;

        Map<String, List<QuestionRef>> byKind = links(q.slug());
        return Optional.of(new QuestionView(q.slug(), q.topicSlug(), q.topicName(), q.categorySlug(), q.tier(), q.difficulty(),
                q.title(), q.keywords(), q.hasExtra(), q.spokenAnswer(), q.detailMd(), q.status(), q.reviewedAt(),
                q.needsReview(), q.baseVersion(), q.sources(), q.topicSources(), prev, next, q.contentHash(), q.importance(),
                q.concepts(), byKind.getOrDefault("FOLLOWUP", List.of()), byKind.getOrDefault("PREREQ", List.of()),
                byKind.getOrDefault("RELATED", List.of())));
    }

    /**
     * 이 질문에서 나가는 연결과, 이 질문으로 들어오는 RELATED(방향 없음)를 보이는 질문만 골라 종류별로 묶는다.
     * UNION 이라 양쪽에서 같은 RELATED 가 있어도 한 번만 나온다.
     */
    private Map<String, List<QuestionRef>> links(String slug) {
        String out = visibility.questionVisible("o", "ot");
        String sql = """
                SELECT l.kind, o.slug, o.title, o.tier, o.topic_slug, o.sort,
                       CASE o.tier WHEN 'BASIC' THEN 1 WHEN 'DEEP' THEN 2 ELSE 3 END AS tier_rank
                FROM question_link l JOIN question o ON o.id = l.to_id JOIN topic ot ON ot.slug = o.topic_slug
                WHERE l.from_id = (SELECT id FROM question WHERE slug = ?) AND %1$s
                UNION
                SELECT l.kind, o.slug, o.title, o.tier, o.topic_slug, o.sort,
                       CASE o.tier WHEN 'BASIC' THEN 1 WHEN 'DEEP' THEN 2 ELSE 3 END AS tier_rank
                FROM question_link l JOIN question o ON o.id = l.from_id JOIN topic ot ON ot.slug = o.topic_slug
                WHERE l.to_id = (SELECT id FROM question WHERE slug = ?) AND l.kind = 'RELATED' AND %1$s
                ORDER BY kind, tier_rank, sort, slug
                """.formatted(out);
        Map<String, List<QuestionRef>> byKind = new LinkedHashMap<>();
        jdbc.query(sql, rs -> {
            byKind.computeIfAbsent(rs.getString("kind"), k -> new ArrayList<>()).add(
                    new QuestionRef(rs.getString("slug"), rs.getString("title"), rs.getString("tier"), rs.getString("topic_slug")));
        }, slug, slug);
        byKind.replaceAll((k, v) -> List.copyOf(v));
        return byKind;
    }

    // ------------------------------------------------------------------ 개념

    @Override
    public List<ConceptView> concepts() {
        return jdbc.query(conceptListSql("TRUE"), (rs, n) -> conceptView(rs));
    }

    @Override
    public Optional<ConceptDetail> concept(String slug) {
        List<ConceptView> found = jdbc.query(conceptListSql("c.slug = ?"), (rs, n) -> conceptView(rs), slug);
        if (found.isEmpty()) {
            return Optional.empty();
        }
        String sql = """
                SELECT %s
                FROM question q JOIN topic t ON t.slug = q.topic_slug JOIN category cat ON cat.slug = t.category_slug
                WHERE EXISTS (SELECT 1 FROM question_concept x WHERE x.question_id = q.id AND x.concept_slug = ?) AND %s
                ORDER BY cat.sort, cat.slug, t.sort, t.slug, %s
                """.formatted(SUMMARY_COLUMNS, visibility.questionVisible("q", "t"), QUESTION_ORDER);
        List<QuestionSummary> questions = jdbc.query(sql, (rs, n) -> summary(rs), slug);
        return Optional.of(new ConceptDetail(found.get(0), List.copyOf(questions)));
    }

    /** 보이는 질문이 하나라도 있는 개념만 나오도록 질문과 조인한다. */
    private String conceptListSql(String where) {
        return """
                SELECT c.slug, c.name, c.description, COUNT(q.id) AS question_count
                FROM concept c
                JOIN question_concept qc ON qc.concept_slug = c.slug
                JOIN question q ON q.id = qc.question_id
                JOIN topic t ON t.slug = q.topic_slug
                WHERE %s AND %s
                GROUP BY c.slug, c.name, c.description, c.sort
                ORDER BY c.sort, c.slug
                """.formatted(where, visibility.questionVisible("q", "t"));
    }

    // ------------------------------------------------------------------ 행 변환

    private static ConceptView conceptView(ResultSet rs) throws SQLException {
        return new ConceptView(rs.getString("slug"), rs.getString("name"), rs.getString("description"), rs.getInt("question_count"));
    }

    private static QuestionSummary summary(ResultSet rs) throws SQLException {
        return new QuestionSummary(rs.getString("slug"), rs.getString("topic_slug"), rs.getString("tier"), rs.getInt("difficulty"),
                rs.getString("title"), textArray(rs.getArray("keywords")), rs.getBoolean("has_extra"),
                rs.getObject("importance", Integer.class), textArray(rs.getArray("concept_slugs")));
    }

    private static TopicSummary topicSummary(ResultSet rs) throws SQLException {
        return new TopicSummary(rs.getString("topic_slug"), rs.getString("topic_name"), rs.getString("description"),
                rs.getString("base_version"), new TierCounts(rs.getInt("basic"), rs.getInt("deep"), rs.getInt("tricky")));
    }

    private static List<SourceView> sources(ResultSet rs) throws SQLException {
        List<String> urls = textArray(rs.getArray("source_urls"));
        List<String> notes = textArray(rs.getArray("source_notes"));
        List<SourceView> result = new ArrayList<>();
        for (int i = 0; i < urls.size(); i++) {
            result.add(new SourceView(urls.get(i), i < notes.size() ? notes.get(i) : null));
        }
        return List.copyOf(result);
    }

    private static List<String> textArray(Array array) throws SQLException {
        if (array == null) {
            return List.of();
        }
        String[] values = (String[]) array.getArray();
        return java.util.Arrays.asList(values);
    }
}
