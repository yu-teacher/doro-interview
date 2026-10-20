package com.doro.interview.catalog;

import com.doro.interview.catalog.content.ContentLoader;
import com.doro.interview.support.ContentFixture;
import com.doro.interview.support.IsolatedSchema;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.nio.file.Path;

/**
 * 카탈로그 읽기 시험의 공통 데이터(전용 스키마, 임시 content/).
 *
 * <pre>
 * c1 / t1  공개   aa-01 DEEP · aa-02 BASIC · aa-03 TRICKY · aa-04 BASIC   (전부 REVIEWED)   → 보이는 순서: aa-02, aa-04, aa-01, aa-03
 * c1 / t2  비공개  bb-01 BASIC (DRAFT)
 * c2 / t3  비공개  cc-01 BASIC (DRAFT)                                      (공개 주제가 없는 카테고리)
 * </pre>
 */
abstract class AbstractCatalogReaderTest {

    static final String HEADER = "**모범 답변 (30~60초)**\n";

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
    CatalogReader reader;

    @TempDir
    Path tmp;
    ContentFixture fx;

    @BeforeEach
    void seed() {
        jdbc.execute("TRUNCATE question_link, question, topic, category CASCADE");
        fx = new ContentFixture(tmp).category("c1").category("c2")
                .topic("c1", "t1", "aa", true).topic("c1", "t2", "bb", false).topic("c2", "t3", "cc", false)
                .questionFull("c1", "t1", "aa-01", "DEEP", "심화 질문", HEADER + "심화 답변.\n", "2026-10-20", java.util.List.of())
                .questionFull("c1", "t1", "aa-02", "BASIC", "기본 질문", HEADER + "기본 답변.\n\n(공식 문서) 근거 줄.\n(보충) 덧붙임.\n", "2026-10-20",
                        java.util.List.of("https://docs.example/aa-02"))
                .questionFull("c1", "t1", "aa-03", "TRICKY", "함정 질문", HEADER + "함정 답변.\n", "2026-10-20", java.util.List.of())
                .questionFull("c1", "t1", "aa-04", "BASIC", "기본 질문 둘", HEADER + "기본 답변 둘.\n", "2026-10-20", java.util.List.of())
                .question("c1", "t2", "bb-01", "비공개 주제의 질문", HEADER + "초안 답변.\n")
                .question("c2", "t3", "cc-01", "비공개 카테고리의 질문", HEADER + "초안 답변.\n");
        loader.load(fx.location());
    }

    /** aa-04 의 파일을 지우고 다시 반영한다(= 닫힘). */
    void retireAa04() {
        fx.delete("c1", "t1", "aa-04");
        loader.load(fx.location());
    }
}
