package com.doro.interview.api;

import com.doro.interview.catalog.content.ContentLoader;
import com.doro.interview.support.ContentFixture;
import com.doro.interview.support.IsolatedSchema;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.file.Path;
import java.util.List;

/**
 * API 시험의 공통 데이터(전용 스키마).
 *
 * <pre>
 * 개념: proxy(프록시), hid(숨은 개념: bb-01 에만)
 * c1/t1 공개 : aa-01 DEEP · aa-02 BASIC(필수도 3, 개념 proxy, FOLLOWUP→aa-01, PREREQ→aa-03, RELATED→bb-01) · aa-03 TRICKY   (전부 REVIEWED)
 * c1/t2 비공개: bb-01 BASIC (DRAFT, 개념 hid)
 * </pre>
 */
abstract class AbstractApiTest {

    static final String HEADER = "**모범 답변 (30~60초)**\n";

    @DynamicPropertySource
    static void schema(DynamicPropertyRegistry registry) {
        String url = IsolatedSchema.createAndGetUrl();
        registry.add("spring.datasource.url", () -> url);
    }

    @Autowired
    MockMvc mvc;
    @Autowired
    JdbcTemplate jdbc;
    @Autowired
    ContentLoader loader;

    @TempDir
    Path tmp;
    ContentFixture fx;

    @BeforeEach
    void seed() {
        jdbc.execute("TRUNCATE question_link, question_concept, question, concept, topic, category CASCADE");
        fx = new ContentFixture(tmp).category("c1").concepts("proxy=프록시", "hid=숨은 개념")
                .topic("c1", "t1", "aa", true).topic("c1", "t2", "bb", false)
                .questionWith("c1", "t1", "aa-01", "DEEP", "심화 질문", List.of("심화키워드"), HEADER + "심화 답변.\n", "2026-10-20", List.of(), List.of())
                .questionWith("c1", "t1", "aa-02", "BASIC", "트랜잭션 전파 질문", List.of("전파키워드", "둘"),
                        HEADER + "기본 답변.\n\n(공식 문서) 근거 줄.\n(보충) 덧붙임.\n", "2026-10-20", List.of("https://docs.example/aa-02"),
                        List.of("concepts: [\"proxy\"]", "importance: 3",
                                "links: [{to: \"aa-01\", kind: FOLLOWUP}, {to: \"aa-03\", kind: PREREQ}, {to: \"bb-01\", kind: RELATED}]"))
                .questionWith("c1", "t1", "aa-03", "TRICKY", "함정 질문", List.of("함정키워드"), HEADER + "함정 답변.\n", "2026-10-20", List.of(), List.of())
                .questionWith("c1", "t2", "bb-01", "BASIC", "비공개 주제의 질문 전파", List.of("숨김키워드"), HEADER + "초안 답변.\n", null, List.of(),
                        List.of("concepts: [\"hid\"]"));
        loader.load(fx.location());
    }
}
