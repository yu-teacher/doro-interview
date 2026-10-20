package com.doro.interview.catalog.content;

import com.doro.interview.support.ContentFixture;
import com.doro.interview.support.IsolatedSchema;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** 개념 사전·질문별 개념·연결·필수도의 반영(D15~D17): 통째 교체, 정리, 해시 불변. */
@SpringBootTest(properties = "interview.content.location=file:build/no-such-content/")
class ContentRelationsLoadTest {

    private static final String BODY = "**모범 답변 (30~60초)**\n답변.\n";

    @DynamicPropertySource
    static void schema(DynamicPropertyRegistry registry) {
        String url = IsolatedSchema.createAndGetUrl();
        registry.add("spring.datasource.url", () -> url);
    }

    @Autowired
    JdbcTemplate jdbc;
    @Autowired
    ContentLoader loader;

    @TempDir
    Path tmp;
    ContentFixture fx;

    @BeforeEach
    void clean() {
        jdbc.execute("TRUNCATE question_link, question_concept, question, concept, topic, category CASCADE");
        fx = new ContentFixture(tmp).category("c1").topic("c1", "t1", "aa", false);
    }

    private ContentFixture q(String slug, String... extra) {
        return fx.questionFull("c1", "t1", slug, "BASIC", "제목 " + slug, BODY, null, List.of(), List.of(extra));
    }

    private List<String> conceptsOf(String slug) {
        return jdbc.queryForList("select qc.concept_slug from question_concept qc join question q on q.id = qc.question_id "
                + "join concept c on c.slug = qc.concept_slug where q.slug = ? order by c.sort", String.class, slug);
    }

    private List<String> links(String slug, String kind) {
        return jdbc.queryForList("select o.slug from question_link l join question f on f.id = l.from_id join question o on o.id = l.to_id "
                + "where f.slug = ? and l.kind = ? order by o.slug", String.class, slug, kind);
    }

    private int count(String table) {
        return jdbc.queryForObject("select count(*) from " + table, Integer.class);
    }

    // -- 개념 사전

    @Test
    void 개념_사전이_파일_순서대로_들어간다() {
        fx.concepts("proxy=프록시", "tx=트랜잭션 경계");
        q("aa-01");
        loader.load(fx.location());
        assertThat(jdbc.queryForList("select slug from concept order by sort", String.class)).containsExactly("proxy", "tx");
        assertThat(jdbc.queryForObject("select name from concept where slug = 'tx'", String.class)).isEqualTo("트랜잭션 경계");
        assertThat(jdbc.queryForObject("select description from concept where slug = 'tx'", String.class)).isEqualTo("설명 tx");
    }

    @Test
    void 사전에서_순서와_이름을_바꾸면_반영된다() {
        fx.concepts("proxy=프록시", "tx=트랜잭션 경계");
        q("aa-01");
        loader.load(fx.location());
        fx.concepts("tx=트랜잭션", "proxy=프록시");
        loader.load(fx.location());
        assertThat(jdbc.queryForList("select slug from concept order by sort", String.class)).containsExactly("tx", "proxy");
        assertThat(jdbc.queryForObject("select name from concept where slug = 'tx'", String.class)).isEqualTo("트랜잭션");
    }

    @Test
    void 사전에서_사라진_개념은_지워진다() {
        fx.concepts("proxy=프록시", "tx=트랜잭션 경계");
        q("aa-01", "concepts: [\"proxy\"]");
        loader.load(fx.location());
        fx.concepts("proxy=프록시");
        loader.load(fx.location());
        assertThat(jdbc.queryForList("select slug from concept", String.class)).containsExactly("proxy");
    }

    @Test
    void 질문이_쓰는_개념을_사전에서_빼면_거부하고_DB는_그대로다() {
        fx.concepts("proxy=프록시", "tx=트랜잭션 경계");
        q("aa-01", "concepts: [\"tx\"]");
        loader.load(fx.location());
        fx.concepts("proxy=프록시");
        assertThatThrownBy(() -> loader.load(fx.location())).isInstanceOf(ContentException.class).hasMessageContaining("개념 사전");
        assertThat(count("concept")).isEqualTo(2);
        assertThat(conceptsOf("aa-01")).containsExactly("tx");
    }

    // -- 질문별 개념

    @Test
    void 질문의_개념이_저장되고_바꾸면_통째로_교체된다() {
        fx.concepts("proxy=프록시", "tx=트랜잭션 경계", "jpa=영속성 컨텍스트");
        q("aa-01", "concepts: [\"proxy\", \"tx\"]");
        loader.load(fx.location());
        assertThat(conceptsOf("aa-01")).containsExactly("proxy", "tx");
        q("aa-01", "concepts: [\"jpa\"]");
        loader.load(fx.location());
        assertThat(conceptsOf("aa-01")).containsExactly("jpa");
        q("aa-01");
        loader.load(fx.location());
        assertThat(conceptsOf("aa-01")).isEmpty();
        assertThat(count("question_concept")).isZero();
    }

    // -- 필수도

    @Test
    void 필수도가_저장되고_없으면_미분류이며_지우면_다시_미분류가_된다() {
        q("aa-01", "importance: 3");
        q("aa-02");
        loader.load(fx.location());
        assertThat(jdbc.queryForObject("select importance from question where slug = 'aa-01'", Integer.class)).isEqualTo(3);
        assertThat(jdbc.queryForObject("select importance is null from question where slug = 'aa-02'", Boolean.class)).isTrue();
        q("aa-01");
        loader.load(fx.location());
        assertThat(jdbc.queryForObject("select importance is null from question where slug = 'aa-01'", Boolean.class)).isTrue();
    }

    @Test
    void 범위를_벗어난_필수도는_거부한다() {
        q("aa-01", "importance: 4");
        assertThatThrownBy(() -> loader.load(fx.location())).isInstanceOf(ContentException.class).hasMessageContaining("importance");
        assertThat(count("question")).isZero();
    }

    @Test
    void 정수가_아닌_필수도는_거부한다() {
        q("aa-01", "importance: \"높음\"");
        assertThatThrownBy(() -> loader.load(fx.location())).isInstanceOf(ContentException.class).hasMessageContaining("importance 는 정수");
    }

    // -- 연결

    @Test
    void 연결이_종류별로_저장되고_바꾸면_통째로_교체된다() {
        q("aa-01", "links: [{to: \"aa-02\", kind: FOLLOWUP}, {to: \"aa-03\", kind: PREREQ}, {to: \"aa-02\", kind: RELATED}]");
        q("aa-02");
        q("aa-03");
        loader.load(fx.location());
        assertThat(links("aa-01", "FOLLOWUP")).containsExactly("aa-02");
        assertThat(links("aa-01", "PREREQ")).containsExactly("aa-03");
        assertThat(links("aa-01", "RELATED")).containsExactly("aa-02");
        q("aa-01", "links: [{to: \"aa-03\", kind: FOLLOWUP}]");
        loader.load(fx.location());
        assertThat(links("aa-01", "FOLLOWUP")).containsExactly("aa-03");
        assertThat(links("aa-01", "PREREQ")).isEmpty();
        assertThat(count("question_link")).isEqualTo(1);
    }

    @Test
    void 다른_질문이_나에게_건_연결은_내_파일을_바꿔도_유지된다() {
        q("aa-01", "links: [{to: \"aa-02\", kind: RELATED}]");
        q("aa-02");
        loader.load(fx.location());
        q("aa-02", "concepts: []");
        loader.load(fx.location());
        assertThat(links("aa-01", "RELATED")).containsExactly("aa-02");
    }

    @Test
    void 없는_질문으로의_연결은_거부하고_DB는_그대로다() {
        q("aa-01", "links: [{to: \"aa-02\", kind: FOLLOWUP}]");
        q("aa-02");
        loader.load(fx.location());
        q("aa-01", "links: [{to: \"aa-99\", kind: FOLLOWUP}]");
        assertThatThrownBy(() -> loader.load(fx.location())).isInstanceOf(ContentException.class).hasMessageContaining("없는 질문을 가리키는");
        assertThat(links("aa-01", "FOLLOWUP")).containsExactly("aa-02");
    }

    @Test
    void 연결이_남은_채_대상_질문_파일을_지우면_거부한다() {
        q("aa-01", "links: [{to: \"aa-02\", kind: FOLLOWUP}]");
        q("aa-02");
        loader.load(fx.location());
        fx.delete("c1", "t1", "aa-02");
        assertThatThrownBy(() -> loader.load(fx.location())).isInstanceOf(ContentException.class)
                .hasMessageContaining("없는 질문을 가리키는").hasMessageContaining("aa-02");
        assertThat(jdbc.queryForObject("select retired_at is null from question where slug = 'aa-02'", Boolean.class)).isTrue();
    }

    @Test
    void 순환_연결은_거부한다() {
        q("aa-01", "links: [{to: \"aa-02\", kind: PREREQ}]");
        q("aa-02", "links: [{to: \"aa-01\", kind: PREREQ}]");
        assertThatThrownBy(() -> loader.load(fx.location())).isInstanceOf(ContentException.class).hasMessageContaining("순환");
        assertThat(count("question")).isZero();
    }

    @Test
    void 연결_형식이_틀리면_거부한다() {
        fx.write(fx.questionFile("c1", "t1", "aa-01"),
                "---\nslug: \"aa-01\"\ntopic: \"t1\"\ntier: BASIC\ndifficulty: 1\ntitle: \"t\"\nkeywords: [\"k\"]\nhas_extra: false\nstatus: DRAFT\nlinks: [\"aa-02\"]\n---\n" + BODY);
        assertThatThrownBy(() -> loader.load(fx.location())).isInstanceOf(ContentException.class).hasMessageContaining("links 항목은 to·kind");
    }

    // -- 해시·검수 표시에 영향이 없다

    @Test
    void 개념_연결_필수도만_바뀌면_해시와_검수필요와_수정시각이_그대로다() {
        fx.concepts("proxy=프록시");
        fx.questionFull("c1", "t1", "aa-01", "BASIC", "제목 aa-01", BODY, "2026-10-20", List.of(), List.of());
        q("aa-02");
        loader.load(fx.location());
        Map<String, Object> before = jdbc.queryForMap("select content_hash, needs_review, updated_at from question where slug = 'aa-01'");
        fx.questionFull("c1", "t1", "aa-01", "BASIC", "제목 aa-01", BODY, "2026-10-20", List.of(),
                List.of("concepts: [\"proxy\"]", "importance: 2", "links: [{to: \"aa-02\", kind: RELATED}]"));
        loader.load(fx.location());
        assertThat(jdbc.queryForMap("select content_hash, needs_review, updated_at from question where slug = 'aa-01'")).isEqualTo(before);
        assertThat(conceptsOf("aa-01")).containsExactly("proxy");
    }

    // -- 닫힘과 되살림

    @Test
    void 닫힌_질문은_개념과_연결_소속을_잃고_되살아나면_파일_값으로_돌아온다() {
        fx.concepts("proxy=프록시");
        q("aa-01", "concepts: [\"proxy\"]", "importance: 2", "links: [{to: \"aa-02\", kind: FOLLOWUP}]");
        q("aa-02");
        loader.load(fx.location());
        assertThat(conceptsOf("aa-01")).containsExactly("proxy");

        fx.delete("c1", "t1", "aa-01");
        loader.load(fx.location());
        assertThat(conceptsOf("aa-01")).isEmpty();
        assertThat(links("aa-01", "FOLLOWUP")).isEmpty();
        assertThat(jdbc.queryForObject("select retired_at is not null from question where slug = 'aa-01'", Boolean.class)).isTrue();

        q("aa-01", "concepts: [\"proxy\"]", "importance: 2", "links: [{to: \"aa-02\", kind: FOLLOWUP}]");
        loader.load(fx.location());
        assertThat(conceptsOf("aa-01")).containsExactly("proxy");
        assertThat(links("aa-01", "FOLLOWUP")).containsExactly("aa-02");
    }

    @Test
    void 닫힌_질문만_쓰던_개념도_사전에서_빼면_정리된다() {
        fx.concepts("proxy=프록시", "tx=트랜잭션 경계");
        q("aa-01", "concepts: [\"tx\"]");
        q("aa-02");
        loader.load(fx.location());
        fx.delete("c1", "t1", "aa-01");
        fx.concepts("proxy=프록시");
        loader.load(fx.location());
        assertThat(jdbc.queryForList("select slug from concept", String.class)).containsExactly("proxy");
        assertThat(count("question_concept")).isZero();
    }
}
