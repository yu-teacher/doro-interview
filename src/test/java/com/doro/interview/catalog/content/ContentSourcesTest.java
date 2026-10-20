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

/** 질문별 sources(D14): 읽기·저장·검증, 그리고 해시·검수 표시에 영향을 주지 않는다는 것. */
@SpringBootTest(properties = "interview.content.location=file:build/no-such-content/")
class ContentSourcesTest {

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
        jdbc.execute("TRUNCATE question_link, question, topic, category CASCADE");
        fx = new ContentFixture(tmp).category("c1").topic("c1", "t1", "aa", false);
    }

    private Map<String, Object> row() {
        return jdbc.queryForMap("select content_hash, needs_review, updated_at, sources::text as sources from question where slug = 'aa-01'");
    }

    @Test
    void sources_가_없는_질문은_빈_배열이다() {
        fx.question("c1", "t1", "aa-01", "제목", BODY);
        loader.load(fx.location());
        assertThat(row().get("sources")).isEqualTo("[]");
    }

    @Test
    void sources_를_읽어_순서대로_저장한다() {
        fx.questionFull("c1", "t1", "aa-01", "BASIC", "제목", BODY, null, List.of("https://a.example/1", "https://b.example/2?x=1&y=\\\"2\\\""));
        loader.load(fx.location());
        assertThat(jdbc.queryForObject("select sources->>0 from question where slug='aa-01'", String.class)).isEqualTo("https://a.example/1");
        assertThat(jdbc.queryForObject("select sources->>1 from question where slug='aa-01'", String.class)).isEqualTo("https://b.example/2?x=1&y=\"2\"");
    }

    @Test
    void sources만_바뀌면_해시와_검수필요와_수정시각이_그대로다() {
        fx.questionFull("c1", "t1", "aa-01", "BASIC", "제목", BODY, "2026-10-20", List.of());
        loader.load(fx.location());
        Map<String, Object> before = row();
        fx.questionFull("c1", "t1", "aa-01", "BASIC", "제목", BODY, "2026-10-20", List.of("https://a.example/1"));
        loader.load(fx.location());
        Map<String, Object> after = row();
        assertThat(after.get("sources")).isEqualTo("[\"https://a.example/1\"]");
        assertThat(after.get("content_hash")).isEqualTo(before.get("content_hash"));
        assertThat(after.get("needs_review")).isEqualTo(false);
        assertThat(after.get("updated_at")).isEqualTo(before.get("updated_at"));
    }

    @Test
    void sources를_지우면_다시_빈_배열이_된다() {
        fx.questionFull("c1", "t1", "aa-01", "BASIC", "제목", BODY, null, List.of("https://a.example/1"));
        loader.load(fx.location());
        fx.question("c1", "t1", "aa-01", "제목", BODY);
        loader.load(fx.location());
        assertThat(row().get("sources")).isEqualTo("[]");
    }

    @Test
    void URL_형식이_틀리면_거부한다() {
        fx.questionFull("c1", "t1", "aa-01", "BASIC", "제목", BODY, null, List.of("ftp://a.example"));
        assertThatThrownBy(() -> loader.load(fx.location())).isInstanceOf(ContentException.class).hasMessageContaining("질문 출처 URL");
        assertThat(jdbc.queryForObject("select count(*) from question", Integer.class)).isZero();
    }

    @Test
    void 목록이_아니거나_문자열이_아니면_거부한다() {
        fx.write(fx.questionFile("c1", "t1", "aa-01"),
                "---\nslug: \"aa-01\"\ntopic: \"t1\"\ntier: BASIC\ndifficulty: 1\ntitle: \"t\"\nkeywords: [\"k\"]\nhas_extra: false\nstatus: DRAFT\nsources: \"https://a.example\"\n---\n" + BODY);
        assertThatThrownBy(() -> loader.load(fx.location())).isInstanceOf(ContentException.class).hasMessageContaining("sources 는 URL 문자열 목록");
        fx.write(fx.questionFile("c1", "t1", "aa-01"),
                "---\nslug: \"aa-01\"\ntopic: \"t1\"\ntier: BASIC\ndifficulty: 1\ntitle: \"t\"\nkeywords: [\"k\"]\nhas_extra: false\nstatus: DRAFT\nsources: [1, 2]\n---\n" + BODY);
        assertThatThrownBy(() -> loader.load(fx.location())).isInstanceOf(ContentException.class).hasMessageContaining("문자열(URL)이 아닌 값");
    }

    @Test
    void 모범_답변_문단이_없는_본문은_거부한다() {
        fx.question("c1", "t1", "aa-01", "제목", "**모범 답변 (30~60초)**\n```java\nclass A {}\n```\n");
        assertThatThrownBy(() -> loader.load(fx.location())).isInstanceOf(ContentException.class).hasMessageContaining("답변 문단");
    }
}
