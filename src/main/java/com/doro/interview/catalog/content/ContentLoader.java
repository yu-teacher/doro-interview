package com.doro.interview.catalog.content;

import com.doro.interview.catalog.content.ContentModels.CategoryDoc;
import com.doro.interview.catalog.content.ContentModels.ConceptDoc;
import com.doro.interview.catalog.content.ContentModels.ContentSet;
import com.doro.interview.catalog.content.ContentModels.LinkDoc;
import com.doro.interview.catalog.content.ContentModels.QuestionDoc;
import com.doro.interview.catalog.content.ContentModels.SourceDoc;
import com.doro.interview.catalog.content.ContentModels.TopicDoc;
import org.flywaydb.core.Flyway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.sql.Types;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 시작할 때 content/ 를 DB 에 반영한다(docs/M0-PLAN.md S4).
 *
 * <ul>
 *   <li>slug 기준 upsert. 같은 콘텐츠를 다시 반영해도 결과가 같다(멱등).</li>
 *   <li>파일에서 사라진 질문은 지우지 않고 {@code retired_at} 으로 닫는다. 다시 나타나면 되살린다.</li>
 *   <li>검수(REVIEWED)한 질문의 내용이 바뀌면 {@code needs_review} 를 올린다. 검수일(reviewed_at)을 갱신하면 내린다.</li>
 *   <li>개념 사전·질문별 개념·연결·필수도는 파일이 원본이다: 질문마다 통째로 교체하고, 파일에서 사라진 개념은 지운다. 이 메타데이터는
 *       해시·needs_review·updated_at 에 영향을 주지 않는다.</li>
 *   <li>한 트랜잭션으로 반영한다. 중간에 실패하면 전부 되돌린다.</li>
 *   <li>검증에 실패하면 DB 를 건드리지 않는다. fail-fast 가 켜져 있으면 기동을 멈춘다.</li>
 * </ul>
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class ContentLoader implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ContentLoader.class);

    public record LoadResult(int categories, int topics, int questions, int retired) {
    }

    private final JdbcTemplate jdbc;
    private final TransactionTemplate tx;
    private final ContentParser parser = new ContentParser();
    private final String location;
    private final boolean failFast;

    // Flyway 를 주입받아 스키마가 먼저 준비되게 한다.
    public ContentLoader(JdbcTemplate jdbc, PlatformTransactionManager txManager, Flyway flyway,
                         @Value("${interview.content.location:classpath:content/}") String location,
                         @Value("${interview.content.fail-fast:true}") boolean failFast) {
        this.jdbc = jdbc;
        this.tx = new TransactionTemplate(txManager);
        this.location = location;
        this.failFast = failFast;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            LoadResult r = load(location);
            log.info("콘텐츠 반영: 카테고리 {}, 주제 {}, 질문 {}, 닫음 {} ({})", r.categories(), r.topics(), r.questions(), r.retired(), location);
        } catch (RuntimeException e) {
            if (failFast) {
                throw e;
            }
            log.error("콘텐츠를 반영하지 못했다(fail-fast 꺼짐, 이전 DB 내용으로 계속 기동): {}", e.getMessage());
        }
    }

    /** 파싱 → 검증 → 한 트랜잭션으로 반영. 검증에 실패하면 DB 는 그대로다. */
    public LoadResult load(String contentLocation) {
        ContentSet set = parser.parse(contentLocation);
        List<String> problems = ContentValidator.validate(set);
        if (!problems.isEmpty()) {
            throw new ContentException(problems);
        }
        return tx.execute(status -> apply(set));
    }

    private LoadResult apply(ContentSet set) {
        for (CategoryDoc c : set.categories()) {
            jdbc.update("""
                    INSERT INTO category (slug, name, sort) VALUES (?, ?, ?)
                    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, sort = EXCLUDED.sort
                    """, c.slug(), c.name(), c.sort());
        }
        for (TopicDoc t : set.topics()) {
            jdbc.update("""
                    INSERT INTO topic (slug, category_slug, name, sort, description, sources, base_version, default_evidence, published)
                    VALUES (?, ?, ?, ?, ?, ?::jsonb, ?, ?, ?)
                    ON CONFLICT (slug) DO UPDATE SET
                        category_slug = EXCLUDED.category_slug, name = EXCLUDED.name, sort = EXCLUDED.sort,
                        description = EXCLUDED.description, sources = EXCLUDED.sources, base_version = EXCLUDED.base_version,
                        default_evidence = EXCLUDED.default_evidence, published = EXCLUDED.published
                    """, t.slug(), t.category(), t.name(), t.sort(), t.description(), sourcesJson(t.sources()),
                    t.baseVersion(), t.defaultEvidence(), t.published());
        }
        for (ConceptDoc c : set.concepts()) {
            jdbc.update("""
                    INSERT INTO concept (slug, name, description, sort) VALUES (?, ?, ?, ?)
                    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, sort = EXCLUDED.sort
                    """, c.slug(), c.name(), c.description(), c.sort());
        }
        for (QuestionDoc q : set.questions()) {
            upsertQuestion(q);
        }
        relink(set);
        String[] slugs = set.questions().stream().map(QuestionDoc::slug).toArray(String[]::new);
        // 파일에 없는 질문만 닫는다. 이미 닫힌 질문은 닫힌 시각을 유지한다.
        int retired = jdbc.update(con -> {
            var ps = con.prepareStatement("UPDATE question SET retired_at = CURRENT_TIMESTAMP WHERE retired_at IS NULL AND NOT (slug = ANY (?))");
            ps.setArray(1, con.createArrayOf("text", slugs));
            return ps;
        });
        // 닫힌 질문은 개념·연결 소속을 갖지 않는다(되살아나면 파일 값으로 다시 생긴다)
        jdbc.update("DELETE FROM question_concept qc USING question q WHERE qc.question_id = q.id AND q.retired_at IS NOT NULL");
        jdbc.update("DELETE FROM question_link l USING question q WHERE l.from_id = q.id AND q.retired_at IS NOT NULL");
        // 사전에서 사라진 개념 삭제(위에서 참조를 모두 정리했으므로 외래키 위반이 없다)
        String[] conceptSlugs = set.concepts().stream().map(ConceptDoc::slug).toArray(String[]::new);
        jdbc.update(con -> {
            var ps = con.prepareStatement("DELETE FROM concept WHERE NOT (slug = ANY (?))");
            ps.setArray(1, con.createArrayOf("text", conceptSlugs));
            return ps;
        });
        return new LoadResult(set.categories().size(), set.topics().size(), set.questions().size(), retired);
    }

    /** 질문별 개념·연결을 파일 내용으로 통째로 교체한다. 모든 질문이 upsert 된 뒤에 호출한다(연결 대상 id 를 찾아야 한다). */
    private void relink(ContentSet set) {
        Map<String, UUID> ids = new HashMap<>();
        String[] slugs = set.questions().stream().map(QuestionDoc::slug).toArray(String[]::new);
        jdbc.query(con -> {
            var ps = con.prepareStatement("SELECT slug, id FROM question WHERE slug = ANY (?)");
            ps.setArray(1, con.createArrayOf("text", slugs));
            return ps;
        }, rs -> {
            ids.put(rs.getString("slug"), rs.getObject("id", UUID.class));
        });
        for (QuestionDoc q : set.questions()) {
            UUID id = ids.get(q.slug());
            jdbc.update("DELETE FROM question_concept WHERE question_id = ?", id);
            for (String concept : q.concepts()) {
                jdbc.update("INSERT INTO question_concept (question_id, concept_slug) VALUES (?, ?)", id, concept);
            }
            jdbc.update("DELETE FROM question_link WHERE from_id = ?", id);
            for (LinkDoc link : q.links()) {
                jdbc.update("INSERT INTO question_link (from_id, to_id, kind) VALUES (?, ?, ?)", id, ids.get(link.to()), link.kind());
            }
        }
    }

    private void upsertQuestion(QuestionDoc q) {
        String hash = ContentHasher.hash(q);
        OffsetDateTime reviewedAt = q.reviewedAt() == null ? null : q.reviewedAt().atOffset(ZoneOffset.UTC);
        jdbc.update(con -> {
            var ps = con.prepareStatement("""
                    INSERT INTO question (slug, topic_slug, sort, tier, difficulty, title, answer_md, keywords, has_extra,
                                          content_hash, status, reviewed_at, sources, importance, refs, needs_review)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb, ?, ?::jsonb, FALSE)
                    ON CONFLICT (slug) DO UPDATE SET
                        topic_slug = EXCLUDED.topic_slug, sort = EXCLUDED.sort, tier = EXCLUDED.tier,
                        difficulty = EXCLUDED.difficulty, title = EXCLUDED.title, answer_md = EXCLUDED.answer_md,
                        keywords = EXCLUDED.keywords, has_extra = EXCLUDED.has_extra,
                        status = EXCLUDED.status, reviewed_at = EXCLUDED.reviewed_at,
                        sources = EXCLUDED.sources, importance = EXCLUDED.importance, refs = EXCLUDED.refs,
                        needs_review = CASE
                            WHEN EXCLUDED.status <> 'REVIEWED' THEN FALSE
                            WHEN EXCLUDED.reviewed_at IS DISTINCT FROM question.reviewed_at THEN FALSE
                            WHEN question.content_hash <> EXCLUDED.content_hash THEN TRUE
                            ELSE question.needs_review END,
                        updated_at = CASE WHEN question.content_hash <> EXCLUDED.content_hash
                                          THEN CURRENT_TIMESTAMP ELSE question.updated_at END,
                        content_hash = EXCLUDED.content_hash,
                        retired_at = NULL
                    """);
            ps.setString(1, q.slug());
            ps.setString(2, q.topic());
            ps.setInt(3, q.sort());
            ps.setString(4, q.tier());
            ps.setInt(5, q.difficulty());
            ps.setString(6, q.title());
            ps.setString(7, q.body());
            ps.setArray(8, con.createArrayOf("text", q.keywords().toArray(String[]::new)));
            ps.setBoolean(9, q.hasExtra());
            ps.setString(10, hash);
            ps.setString(11, q.status());
            if (reviewedAt == null) {
                ps.setNull(12, Types.TIMESTAMP_WITH_TIMEZONE);
            } else {
                ps.setObject(12, reviewedAt);
            }
            ps.setString(13, jsonStringArray(q.sources()));
            if (q.importance() == null) {
                ps.setNull(14, Types.SMALLINT);
            } else {
                ps.setInt(14, q.importance());
            }
            ps.setString(15, jsonStringArray(q.refs().stream().map(String::strip).toList()));
            return ps;
        });
    }

    static String sourcesJson(List<SourceDoc> sources) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < sources.size(); i++) {
            SourceDoc s = sources.get(i);
            if (i > 0) {
                sb.append(',');
            }
            sb.append("{\"url\":").append(jsonString(s.url()));
            if (s.note() != null) {
                sb.append(",\"note\":").append(jsonString(s.note()));
            }
            sb.append('}');
        }
        return sb.append(']').toString();
    }

    static String jsonStringArray(List<String> values) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < values.size(); i++) {
            if (i > 0) {
                sb.append(',');
            }
            sb.append(jsonString(values.get(i)));
        }
        return sb.append(']').toString();
    }

    static String jsonString(String value) {
        StringBuilder sb = new StringBuilder("\"");
        for (char c : value.toCharArray()) {
            switch (c) {
                case '"' -> sb.append("\\\"");
                case '\\' -> sb.append("\\\\");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> {
                    if (c < 0x20) {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
                }
            }
        }
        return sb.append('"').toString();
    }
}
