package com.doro.interview.catalog;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** V1 스키마가 의도한 제약을 실제로 거는지 확인한다(실제 Postgres). 각 테스트는 롤백된다. */
@SpringBootTest
@Transactional
class CatalogSchemaTest {

    private static final String HASH = "a".repeat(64);

    @Autowired
    JdbcTemplate jdbc;
    @Autowired
    Flyway flyway;

    @Test
    void 마이그레이션을_다시_돌려도_적용할_것이_없다() {
        assertThat(flyway.migrate().migrationsExecuted).isZero();
    }

    @Test
    void 카테고리_주제_질문이_연결된다() {
        seedTopic("t-ok");
        insertQuestion("t-ok-01", "t-ok", "BASIC", 1, "DRAFT", "{a}");
        Integer n = jdbc.queryForObject("select count(*) from question where topic_slug = 't-ok'", Integer.class);
        assertThat(n).isEqualTo(1);
    }

    @Test
    void 주제는_기본이_비공개이고_근거_기본값은_UNKNOWN이다() {
        seedTopic("t-def");
        var row = jdbc.queryForMap("select published, default_evidence from topic where slug = 't-def'");
        assertThat(row.get("published")).isEqualTo(false);
        assertThat(row.get("default_evidence")).isEqualTo("UNKNOWN");
    }

    @Test
    void 알_수_없는_tier를_거부한다() {
        seedTopic("t-tier");
        assertThatThrownBy(() -> insertQuestion("t-tier-01", "t-tier", "HARD", 1, "DRAFT", "{a}"))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void 범위를_벗어난_난이도를_거부한다() {
        seedTopic("t-diff");
        assertThatThrownBy(() -> insertQuestion("t-diff-01", "t-diff", "BASIC", 4, "DRAFT", "{a}"))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void 알_수_없는_상태를_거부한다() {
        seedTopic("t-st");
        assertThatThrownBy(() -> insertQuestion("t-st-01", "t-st", "BASIC", 1, "DONE", "{a}"))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void 키워드가_비어_있으면_거부한다() {
        seedTopic("t-kw");
        assertThatThrownBy(() -> insertQuestion("t-kw-01", "t-kw", "BASIC", 1, "DRAFT", "{}"))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void slug는_중복될_수_없다() {
        seedTopic("t-dup");
        insertQuestion("t-dup-01", "t-dup", "BASIC", 1, "DRAFT", "{a}");
        assertThatThrownBy(() -> insertQuestion("t-dup-01", "t-dup", "DEEP", 2, "DRAFT", "{a}"))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void 없는_주제를_참조하는_질문을_거부한다() {
        assertThatThrownBy(() -> insertQuestion("x-01", "no-such-topic", "BASIC", 1, "DRAFT", "{a}"))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void 해시_형식이_틀리면_거부한다() {
        seedTopic("t-hash");
        assertThatThrownBy(() -> jdbc.update(
                "insert into question (slug, topic_slug, tier, difficulty, title, answer_md, keywords, content_hash) "
                        + "values ('t-hash-01', 't-hash', 'BASIC', 1, 't', 'a', '{k}', 'not-a-hash')"))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void 질문_연결은_자기_자신을_가리킬_수_없다() {
        seedTopic("t-link");
        insertQuestion("t-link-01", "t-link", "BASIC", 1, "DRAFT", "{a}");
        assertThatThrownBy(() -> jdbc.update(
                "insert into question_link (from_id, to_id, kind) "
                        + "select id, id, 'RELATED' from question where slug = 't-link-01'"))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    private void seedTopic(String slug) {
        jdbc.update("insert into category (slug, name) values ('c-' || ?, 'c') on conflict do nothing", slug);
        jdbc.update("insert into topic (slug, category_slug, name) values (?, 'c-' || ?, 'n')", slug, slug);
    }

    private void insertQuestion(String slug, String topic, String tier, int difficulty, String status, String keywords) {
        jdbc.update(
                "insert into question (slug, topic_slug, tier, difficulty, title, answer_md, keywords, content_hash, status) "
                        + "values (?, ?, ?, ?, 't', 'a', ?::text[], ?, ?)",
                slug, topic, tier, difficulty, keywords, HASH, status);
    }
}
