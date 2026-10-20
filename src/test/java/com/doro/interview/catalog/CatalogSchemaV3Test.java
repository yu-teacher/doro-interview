package com.doro.interview.catalog;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** V3: 개념·필수도·연결 종류 제약. 제약 위반 뒤에는 같은 트랜잭션을 쓸 수 없어 케이스마다 테스트를 나눈다. */
@SpringBootTest
@Transactional
class CatalogSchemaV3Test {

    @Autowired
    JdbcTemplate jdbc;

    private void seed() {
        jdbc.update("insert into category (slug, name) values ('v3c', 'c') on conflict do nothing");
        jdbc.update("insert into topic (slug, category_slug, name) values ('v3t', 'v3c', 'n') on conflict do nothing");
        jdbc.update("insert into concept (slug, name) values ('v3-concept', '개념') on conflict do nothing");
    }

    private void insertQuestion(String slug, Object importance) {
        jdbc.update("insert into question (slug, topic_slug, tier, difficulty, title, answer_md, keywords, content_hash, importance) "
                + "values (?, 'v3t', 'BASIC', 1, 't', 'a', '{k}', ?, ?)", slug, "c".repeat(64), importance);
    }

    @Test
    void 필수도는_비워_둘_수_있고_1에서_3이면_된다() {
        seed();
        insertQuestion("v3-null", null);
        insertQuestion("v3-one", 1);
        insertQuestion("v3-three", 3);
        assertThat(jdbc.queryForObject("select importance is null from question where slug = 'v3-null'", Boolean.class)).isTrue();
        assertThat(jdbc.queryForObject("select importance from question where slug = 'v3-three'", Integer.class)).isEqualTo(3);
    }

    @Test
    void 필수도_0은_거부한다() {
        seed();
        assertThatThrownBy(() -> insertQuestion("v3-zero", 0)).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void 필수도_4는_거부한다() {
        seed();
        assertThatThrownBy(() -> insertQuestion("v3-four", 4)).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void 연결_종류_PREREQ를_받아들인다() {
        seed();
        insertQuestion("v3-a", null);
        insertQuestion("v3-b", null);
        jdbc.update("insert into question_link (from_id, to_id, kind) select a.id, b.id, 'PREREQ' from question a, question b where a.slug = 'v3-a' and b.slug = 'v3-b'");
        // 실제 콘텐츠(content/)가 이미 PREREQ 연결을 갖고 있으므로 이 시험이 만든 질문의 연결만 센다
        assertThat(jdbc.queryForObject("select count(*) from question_link l join question q on q.id = l.from_id where l.kind = 'PREREQ' and q.slug like 'v3-%'", Integer.class)).isEqualTo(1);
    }

    @Test
    void 알_수_없는_연결_종류는_거부한다() {
        seed();
        insertQuestion("v3-a", null);
        insertQuestion("v3-b", null);
        assertThatThrownBy(() -> jdbc.update("insert into question_link (from_id, to_id, kind) select a.id, b.id, 'BAD' from question a, question b where a.slug = 'v3-a' and b.slug = 'v3-b'"))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void 질문_개념은_같은_쌍이_중복될_수_없다() {
        seed();
        insertQuestion("v3-a", null);
        jdbc.update("insert into question_concept (question_id, concept_slug) select id, 'v3-concept' from question where slug = 'v3-a'");
        assertThatThrownBy(() -> jdbc.update("insert into question_concept (question_id, concept_slug) select id, 'v3-concept' from question where slug = 'v3-a'"))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void 없는_개념은_질문에_붙일_수_없다() {
        seed();
        insertQuestion("v3-a", null);
        assertThatThrownBy(() -> jdbc.update("insert into question_concept (question_id, concept_slug) select id, 'no-such-concept' from question where slug = 'v3-a'"))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
