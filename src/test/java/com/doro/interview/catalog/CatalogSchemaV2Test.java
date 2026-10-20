package com.doro.interview.catalog;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** V2: question.sources 의 기본값과 제약. */
@SpringBootTest
@Transactional
class CatalogSchemaV2Test {

    @Autowired
    JdbcTemplate jdbc;

    private void seed() {
        jdbc.update("insert into category (slug, name) values ('v2c', 'c') on conflict do nothing");
        jdbc.update("insert into topic (slug, category_slug, name) values ('v2t', 'v2c', 'n') on conflict do nothing");
    }

    private void insert(String slug, String sources) {
        jdbc.update("insert into question (slug, topic_slug, tier, difficulty, title, answer_md, keywords, content_hash, sources) "
                + "values (?, 'v2t', 'BASIC', 1, 't', 'a', '{k}', ?, ?::jsonb)", slug, "b".repeat(64), sources);
    }

    @Test
    void sources_기본값은_빈_배열이다() {
        seed();
        jdbc.update("insert into question (slug, topic_slug, tier, difficulty, title, answer_md, keywords, content_hash) "
                + "values ('v2-default', 'v2t', 'BASIC', 1, 't', 'a', '{k}', ?)", "b".repeat(64));
        assertThat(jdbc.queryForObject("select sources::text from question where slug = 'v2-default'", String.class)).isEqualTo("[]");
    }

    @Test
    void URL_배열을_저장하고_순서를_보존한다() {
        seed();
        insert("v2-ok", "[\"https://a.example/1\", \"https://b.example/2\"]");
        assertThat(jdbc.queryForObject("select sources->>0 from question where slug = 'v2-ok'", String.class)).isEqualTo("https://a.example/1");
        assertThat(jdbc.queryForObject("select sources->>1 from question where slug = 'v2-ok'", String.class)).isEqualTo("https://b.example/2");
    }

    @Test
    void 객체는_거부한다() {
        seed();
        assertThatThrownBy(() -> insert("v2-bad", "{\"url\": \"https://a.example\"}")).isInstanceOf(DataIntegrityViolationException.class);
    }

    // 제약 위반 뒤에는 같은 트랜잭션을 더 쓸 수 없으므로 케이스마다 테스트를 나눈다.
    @Test
    void 문자열은_거부한다() {
        seed();
        assertThatThrownBy(() -> insert("v2-bad2", "\"https://a.example\"")).isInstanceOf(DataIntegrityViolationException.class);
    }
}
