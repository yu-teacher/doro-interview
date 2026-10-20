package com.doro.interview.catalog.content;

import com.doro.interview.catalog.content.ContentLoader.LoadResult;
import com.doro.interview.support.ContentFixture;
import com.doro.interview.support.IsolatedSchema;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.PlatformTransactionManager;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** 전용 스키마(빈 DB)에서 콘텐츠 로더를 시험한다. 콘텐츠는 임시 디렉터리의 파일이다. */
@SpringBootTest(properties = "interview.content.location=file:build/no-such-content/")
class ContentLoaderTest {

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
    PlatformTransactionManager txManager;
    @Autowired
    Flyway flyway;

    @TempDir
    Path tmp;
    ContentFixture fx;

    @BeforeEach
    void clean() {
        jdbc.execute("TRUNCATE question_link, question, topic, category CASCADE");
        jdbc.execute("DROP TRIGGER IF EXISTS boom ON question");
        fx = new ContentFixture(tmp);
    }

    private ContentFixture base() {
        return fx.category("c1").topic("c1", "t1", "aa", false)
                .question("c1", "t1", "aa-01", "첫 질문", "**모범 답변**\n본문 하나.\n")
                .question("c1", "t1", "aa-02", "둘째 질문", "**모범 답변**\n(보충) 본문 둘.\n");
    }

    private int count(String table) {
        return jdbc.queryForObject("select count(*) from " + table, Integer.class);
    }

    // -- 반영

    @Test
    void 빈_DB에_콘텐츠를_반영한다() {
        base();
        LoadResult r = loader.load(fx.location());
        assertThat(r).isEqualTo(new LoadResult(1, 1, 2, 0));
        assertThat(count("category")).isEqualTo(1);
        assertThat(count("topic")).isEqualTo(1);
        assertThat(count("question")).isEqualTo(2);
        Map<String, Object> q = jdbc.queryForMap("select * from question where slug = 'aa-02'");
        assertThat(q.get("tier")).isEqualTo("BASIC");
        assertThat(q.get("sort")).isEqualTo(2);
        assertThat(q.get("has_extra")).isEqualTo(true);
        assertThat(q.get("status")).isEqualTo("DRAFT");
        assertThat(q.get("needs_review")).isEqualTo(false);
        assertThat(q.get("retired_at")).isNull();
        assertThat(String.valueOf(q.get("content_hash"))).matches("[0-9a-f]{64}");
        assertThat(jdbc.queryForObject("select array_to_string(keywords, '|') from question where slug = 'aa-01'", String.class))
                .isEqualTo("하나|둘");
    }

    @Test
    void 주제는_파일의_값대로_반영되고_출처의_특수문자가_보존된다() {
        base();
        loader.load(fx.location());
        Map<String, Object> t = jdbc.queryForMap("select * from topic where slug = 't1'");
        assertThat(t.get("published")).isEqualTo(false);
        assertThat(t.get("base_version")).isEqualTo("v1");
        assertThat(jdbc.queryForObject("select sources->0->>'url' from topic where slug='t1'", String.class)).isEqualTo("https://example.com/doc");
        assertThat(jdbc.queryForObject("select sources->0->>'note' from topic where slug='t1'", String.class))
                .isEqualTo("메모 \"따옴표\" 와 \\ 역슬래시");
    }

    @Test
    void 다시_반영해도_행_해시_수정시각이_그대로다() {
        base();
        loader.load(fx.location());
        List<Map<String, Object>> before = jdbc.queryForList("select slug, content_hash, updated_at, created_at, id from question order by slug");
        loader.load(fx.location());
        List<Map<String, Object>> after = jdbc.queryForList("select slug, content_hash, updated_at, created_at, id from question order by slug");
        assertThat(after).isEqualTo(before);
        assertThat(count("question")).isEqualTo(2);
    }

    // -- 닫기와 되살리기

    @Test
    void 파일을_지우면_질문을_닫되_행은_남긴다() {
        base();
        loader.load(fx.location());
        fx.delete("c1", "t1", "aa-02");
        LoadResult r = loader.load(fx.location());
        assertThat(r.retired()).isEqualTo(1);
        assertThat(count("question")).isEqualTo(2);
        assertThat(jdbc.queryForObject("select retired_at is not null from question where slug='aa-02'", Boolean.class)).isTrue();
        assertThat(jdbc.queryForObject("select retired_at is null from question where slug='aa-01'", Boolean.class)).isTrue();
    }

    @Test
    void 이미_닫힌_질문의_닫힌_시각은_다시_반영해도_유지된다() {
        base();
        loader.load(fx.location());
        fx.delete("c1", "t1", "aa-02");
        loader.load(fx.location());
        Object first = jdbc.queryForObject("select retired_at from question where slug='aa-02'", Object.class);
        loader.load(fx.location());
        assertThat(jdbc.queryForObject("select retired_at from question where slug='aa-02'", Object.class)).isEqualTo(first);
    }

    @Test
    void 파일이_다시_생기면_질문이_되살아난다() {
        base();
        loader.load(fx.location());
        fx.delete("c1", "t1", "aa-02");
        loader.load(fx.location());
        fx.question("c1", "t1", "aa-02", "둘째 질문", "**모범 답변**\n(보충) 본문 둘.\n");
        loader.load(fx.location());
        assertThat(jdbc.queryForObject("select retired_at is null from question where slug='aa-02'", Boolean.class)).isTrue();
        assertThat(count("question")).isEqualTo(2);
    }

    // -- 해시와 검수 표시

    @Test
    void 본문이_바뀌면_해시가_바뀐다() {
        base();
        loader.load(fx.location());
        String before = jdbc.queryForObject("select content_hash from question where slug='aa-01'", String.class);
        fx.question("c1", "t1", "aa-01", "첫 질문", "**모범 답변**\n고친 본문.\n");
        loader.load(fx.location());
        assertThat(jdbc.queryForObject("select content_hash from question where slug='aa-01'", String.class)).isNotEqualTo(before);
        assertThat(jdbc.queryForObject("select answer_md from question where slug='aa-01'", String.class)).contains("고친 본문");
    }

    @Test
    void 줄바꿈과_줄끝_공백만_다르면_해시와_수정시각이_그대로다() throws Exception {
        base();
        loader.load(fx.location());
        Map<String, Object> before = jdbc.queryForMap("select content_hash, updated_at from question where slug='aa-01'");
        Path file = fx.questionFile("c1", "t1", "aa-01");
        // 파일 전체가 CRLF 이고(윈도 편집기), 본문 줄 끝에 공백이 붙은 경우
        String text = Files.readString(file);
        int bodyStart = text.indexOf("\n---\n", 3) + 5;
        String changed = text.substring(0, bodyStart) + text.substring(bodyStart).replace("\n", "  \n");
        Files.writeString(file, changed.replace("\n", "\r\n"));
        loader.load(fx.location());
        assertThat(jdbc.queryForMap("select content_hash, updated_at from question where slug='aa-01'")).isEqualTo(before);
    }

    @Test
    void 초안의_내용이_바뀌어도_검수_필요_표시는_올라가지_않는다() {
        base();
        loader.load(fx.location());
        fx.question("c1", "t1", "aa-01", "첫 질문", "**모범 답변**\n고침.\n");
        loader.load(fx.location());
        assertThat(jdbc.queryForObject("select needs_review from question where slug='aa-01'", Boolean.class)).isFalse();
    }

    @Test
    void 검수한_질문의_내용이_바뀌면_검수_필요가_올라가고_검수일을_갱신하면_내려간다() {
        fx.category("c1").topic("c1", "t1", "aa", false)
                .question("c1", "t1", "aa-01", "첫 질문", "**모범 답변**\n본문.\n", "2026-10-20");
        loader.load(fx.location());
        assertThat(jdbc.queryForObject("select needs_review from question where slug='aa-01'", Boolean.class)).isFalse();
        assertThat(jdbc.queryForObject("select reviewed_at is not null from question where slug='aa-01'", Boolean.class)).isTrue();

        fx.question("c1", "t1", "aa-01", "첫 질문", "**모범 답변**\n고친 본문.\n", "2026-10-20");
        loader.load(fx.location());
        assertThat(jdbc.queryForObject("select needs_review from question where slug='aa-01'", Boolean.class)).isTrue();

        // 다시 읽어 검수했다는 기록(reviewed_at 갱신)이 파일에 들어오면 표시가 내려간다
        fx.question("c1", "t1", "aa-01", "첫 질문", "**모범 답변**\n고친 본문.\n", "2026-10-25");
        loader.load(fx.location());
        assertThat(jdbc.queryForObject("select needs_review from question where slug='aa-01'", Boolean.class)).isFalse();
    }

    // -- 검증 실패와 롤백

    @Test
    void 깨진_frontmatter는_경로와_함께_보고하고_DB는_그대로다() {
        base();
        loader.load(fx.location());
        fx.write(fx.questionFile("c1", "t1", "aa-02"), "---\nslug: [깨진\n---\n본문\n");
        assertThatThrownBy(() -> loader.load(fx.location()))
                .isInstanceOf(ContentException.class)
                .hasMessageContaining("aa-02.md");
        assertThat(count("question")).isEqualTo(2);
        assertThat(jdbc.queryForObject("select retired_at is null from question where slug='aa-02'", Boolean.class)).isTrue();
    }

    @Test
    void 문제가_여럿이면_한_번에_모두_보고한다() {
        base();
        fx.write(fx.questionFile("c1", "t1", "aa-01"), "frontmatter 없음\n");
        fx.write(fx.questionFile("c1", "t1", "aa-02"), "---\nslug: \"aa-02\"\n---\n본문\n");
        assertThatThrownBy(() -> loader.load(fx.location()))
                .isInstanceOfSatisfying(ContentException.class, e -> assertThat(e.problems()).hasSizeGreaterThanOrEqualTo(2));
        assertThat(count("question")).isZero();
    }

    @Test
    void 반영_도중에_실패하면_이번_반영은_전부_되돌려진다() {
        base();
        loader.load(fx.location());
        // 새 주제와 질문 둘을 추가하되, 두 번째 질문 삽입에서 DB 가 실패하도록 트리거를 건다
        jdbc.execute("""
                CREATE OR REPLACE FUNCTION boom() RETURNS trigger AS $$
                BEGIN
                    IF NEW.slug = 'bb-02' THEN RAISE EXCEPTION 'boom'; END IF;
                    RETURN NEW;
                END $$ LANGUAGE plpgsql
                """);
        jdbc.execute("CREATE TRIGGER boom BEFORE INSERT ON question FOR EACH ROW EXECUTE FUNCTION boom()");
        fx.topic("c1", "t2", "bb", false)
                .question("c1", "t2", "bb-01", "새 질문 1", "**모범 답변**\n본문.\n")
                .question("c1", "t2", "bb-02", "새 질문 2", "**모범 답변**\n본문.\n")
                .question("c1", "t1", "aa-01", "첫 질문", "**모범 답변**\n수정된 본문.\n");
        assertThatThrownBy(() -> loader.load(fx.location())).isInstanceOf(RuntimeException.class).hasMessageContaining("boom");
        assertThat(count("topic")).isEqualTo(1);
        assertThat(count("question")).isEqualTo(2);
        assertThat(jdbc.queryForObject("select answer_md from question where slug='aa-01'", String.class)).doesNotContain("수정된");
    }

    @Test
    void 공개_주제에_검수_전_질문이_있으면_거부한다() {
        fx.category("c1").topic("c1", "t1", "aa", true)
                .question("c1", "t1", "aa-01", "첫 질문", "**모범 답변**\n본문.\n");
        assertThatThrownBy(() -> loader.load(fx.location()))
                .isInstanceOf(ContentException.class).hasMessageContaining("검수 전");
        assertThat(count("topic")).isZero();
    }

    @Test
    void 검수를_마친_주제는_공개할_수_있다() {
        fx.category("c1").topic("c1", "t1", "aa", true)
                .question("c1", "t1", "aa-01", "첫 질문", "**모범 답변**\n본문.\n", "2026-10-20");
        loader.load(fx.location());
        assertThat(jdbc.queryForObject("select published from topic where slug='t1'", Boolean.class)).isTrue();
    }

    @Test
    void 질문의_주제가_디렉터리와_다르면_거부한다() {
        base();
        fx.write(fx.questionFile("c1", "t1", "aa-01"),
                "---\nslug: \"aa-01\"\ntopic: \"other\"\ntier: BASIC\ndifficulty: 1\ntitle: \"t\"\nkeywords: [\"k\"]\nhas_extra: false\nstatus: DRAFT\n---\n본문\n");
        assertThatThrownBy(() -> loader.load(fx.location()))
                .isInstanceOf(ContentException.class).hasMessageContaining("디렉터리 이름과 다르다");
    }

    @Test
    void has_extra가_본문과_어긋나면_거부한다() {
        base();
        fx.write(fx.questionFile("c1", "t1", "aa-01"),
                "---\nslug: \"aa-01\"\ntopic: \"t1\"\ntier: BASIC\ndifficulty: 1\ntitle: \"t\"\nkeywords: [\"k\"]\nhas_extra: true\nstatus: DRAFT\n---\n(보충) 없음이 아니라 있다고 했지만 본문에는 표기가 있다\n"
                        .replace("(보충) ", ""));
        assertThatThrownBy(() -> loader.load(fx.location()))
                .isInstanceOf(ContentException.class).hasMessageContaining("has_extra");
    }

    @Test
    void 질문_slug가_다른_주제_접두사를_쓰면_거부한다() {
        base();
        fx.question("c1", "t1", "zz-01", "접두사 틀림", "**모범 답변**\n본문.\n");
        assertThatThrownBy(() -> loader.load(fx.location()))
                .isInstanceOf(ContentException.class).hasMessageContaining("'aa-' 로 시작");
    }

    // -- 기동 시 실행과 fail-fast

    @Test
    void fail_fast가_켜져_있으면_깨진_콘텐츠에서_기동을_멈춘다() {
        fx.write(fx.questionFile("c1", "t1", "aa-01"), "깨짐\n");
        ContentLoader strict = new ContentLoader(jdbc, txManager, flyway, fx.location(), true);
        assertThatThrownBy(() -> strict.run(new DefaultApplicationArguments())).isInstanceOf(ContentException.class);
    }

    @Test
    void fail_fast가_꺼져_있으면_이전_DB로_계속_기동한다() {
        base();
        loader.load(fx.location());
        fx.write(fx.questionFile("c1", "t1", "aa-01"), "깨짐\n");
        ContentLoader lenient = new ContentLoader(jdbc, txManager, flyway, fx.location(), false);
        assertThatCode(() -> lenient.run(new DefaultApplicationArguments())).doesNotThrowAnyException();
        assertThat(count("question")).isEqualTo(2);
    }

    // -- JSON 도우미

    @Test
    void JSON_문자열_이스케이프() {
        assertThat(ContentLoader.jsonString("a\"b\\c\nd\u0001é")).isEqualTo("\"a\\\"b\\\\c\\nd\\u0001é\"");
        assertThat(ContentLoader.sourcesJson(List.of())).isEqualTo("[]");
    }
}
