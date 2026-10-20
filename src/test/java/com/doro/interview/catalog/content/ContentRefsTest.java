package com.doro.interview.catalog.content;

import com.doro.interview.catalog.CatalogReader;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * 질문별 refs(책·원저자 자료 근거, docs/DESIGN.md §4 예외): 읽기·저장·검증, 읽기 모델 노출, 그리고 해시·검수 표시에 영향을 주지 않는다는 것.
 */
@SpringBootTest(properties = "interview.content.location=file:build/no-such-content/")
class ContentRefsTest {

    private static final String BODY = "**모범 답변 (30~60초)**\n답변.\n";
    private static final String HEAD = "---\nslug: \"aa-01\"\ntopic: \"t1\"\ntier: BASIC\ndifficulty: 1\ntitle: \"t\"\nkeywords: [\"k\"]\nhas_extra: false\nstatus: DRAFT\n";

    @DynamicPropertySource
    static void schema(DynamicPropertyRegistry registry) {
        String url = IsolatedSchema.createAndGetUrl();
        registry.add("spring.datasource.url", () -> url);
    }

    @Autowired
    JdbcTemplate jdbc;
    @Autowired
    ContentLoader loader;
    @Autowired
    CatalogReader catalog;

    @TempDir
    Path tmp;
    ContentFixture fx;

    @BeforeEach
    void clean() {
        jdbc.execute("TRUNCATE question_link, question, topic, category CASCADE");
        fx = new ContentFixture(tmp).category("c1").topic("c1", "t1", "aa", true);
    }

    private Map<String, Object> row() {
        return jdbc.queryForMap("select content_hash, needs_review, updated_at, refs::text as refs from question where slug = 'aa-01'");
    }

    private ContentFixture withRefs(String reviewed, String... refs) {
        List<String> lines = refs.length == 0 ? List.of() : List.of("refs: [" + String.join(", ", java.util.Arrays.stream(refs).map(r -> "\"" + r + "\"").toList()) + "]");
        return fx.questionFull("c1", "t1", "aa-01", "BASIC", "제목", BODY, reviewed, List.of(), lines);
    }

    @Test
    void refs_가_없는_질문은_빈_배열이다() {
        withRefs("2026-10-20");
        loader.load(fx.location());
        assertThat(row().get("refs")).isEqualTo("[]");
    }

    @Test
    void refs_를_읽어_순서대로_저장하고_앞뒤_공백은_정리한다() {
        withRefs("2026-10-20", "Design Patterns(GoF), 1장, p.13", "  Clean Architecture, 5장  ");
        loader.load(fx.location());
        assertThat(jdbc.queryForObject("select refs->>0 from question where slug='aa-01'", String.class)).isEqualTo("Design Patterns(GoF), 1장, p.13");
        assertThat(jdbc.queryForObject("select refs->>1 from question where slug='aa-01'", String.class)).isEqualTo("Clean Architecture, 5장");
    }

    @Test
    void 읽기_모델에_refs_가_순서대로_실린다() {
        withRefs("2026-10-20", "책 A, p.1", "책 B, p.2");
        loader.load(fx.location());
        assertThat(catalog.question("aa-01").orElseThrow().refs()).containsExactly("책 A, p.1", "책 B, p.2");
    }

    @Test
    void refs_가_없으면_읽기_모델도_빈_목록이다() {
        withRefs("2026-10-20");
        loader.load(fx.location());
        assertThat(catalog.question("aa-01").orElseThrow().refs()).isEmpty();
    }

    @Test
    void refs만_바뀌면_해시와_검수필요와_수정시각이_그대로다() {
        withRefs("2026-10-20");
        loader.load(fx.location());
        Map<String, Object> before = row();
        withRefs("2026-10-20", "책 A, p.1");
        loader.load(fx.location());
        Map<String, Object> after = row();
        assertThat(after.get("refs")).isEqualTo("[\"책 A, p.1\"]");
        assertThat(after.get("content_hash")).isEqualTo(before.get("content_hash"));
        assertThat(after.get("needs_review")).isEqualTo(false);
        assertThat(after.get("updated_at")).isEqualTo(before.get("updated_at"));
    }

    @Test
    void refs를_지우면_다시_빈_배열이_된다() {
        withRefs("2026-10-20", "책 A, p.1");
        loader.load(fx.location());
        withRefs("2026-10-20");
        loader.load(fx.location());
        assertThat(row().get("refs")).isEqualTo("[]");
    }

    @Test
    void 목록이_아니거나_문자열이_아니면_거부한다() {
        fx.write(fx.questionFile("c1", "t1", "aa-01"), HEAD + "refs: \"책 A, p.1\"\n---\n" + BODY);
        assertThatThrownBy(() -> loader.load(fx.location())).isInstanceOf(ContentException.class).hasMessageContaining("refs 는 문자열 목록");
        fx.write(fx.questionFile("c1", "t1", "aa-01"), HEAD + "refs: [1, 2]\n---\n" + BODY);
        assertThatThrownBy(() -> loader.load(fx.location())).isInstanceOf(ContentException.class).hasMessageContaining("refs 에 문자열이 아닌 값");
        assertThat(jdbc.queryForObject("select count(*) from question", Integer.class)).isZero();
    }

    @Test
    void 열한_개_빈_항목_201자는_거부한다() {
        List<String> eleven = new ArrayList<>();
        for (int i = 0; i < 11; i++) {
            eleven.add("책 " + i + ", p." + i);
        }
        withRefs("2026-10-20", eleven.toArray(String[]::new));
        assertThatThrownBy(() -> loader.load(fx.location())).isInstanceOf(ContentException.class).hasMessageContaining("refs 는 10개 이하");
        withRefs("2026-10-20", "   ");
        assertThatThrownBy(() -> loader.load(fx.location())).isInstanceOf(ContentException.class).hasMessageContaining("refs 항목은 1~200자");
        withRefs("2026-10-20", "가".repeat(201));
        assertThatThrownBy(() -> loader.load(fx.location())).isInstanceOf(ContentException.class).hasMessageContaining("refs 항목은 1~200자");
        withRefs("2026-10-20", "가".repeat(200));
        loader.load(fx.location());
        assertThat(jdbc.queryForObject("select jsonb_array_length(refs) from question where slug='aa-01'", Integer.class)).isOne();
    }
}
