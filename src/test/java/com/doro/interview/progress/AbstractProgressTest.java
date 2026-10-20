package com.doro.interview.progress;

import com.doro.interview.catalog.CatalogReader;
import com.doro.interview.catalog.content.ContentLoader;
import com.doro.interview.progress.read.ProgressReader;
import com.doro.interview.support.ContentFixture;
import com.doro.interview.support.IsolatedSchema;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.nio.file.Path;
import java.util.List;
import java.util.UUID;

/**
 * 진도 시험의 공통 데이터(전용 스키마, 임시 content/).
 *
 * <pre>
 * c1 / t1  공개   aa-01·aa-02·aa-03·aa-04
 * c1 / t2  비공개  bb-01
 * c2 / t4  공개   dd-01·dd-02
 * </pre>
 */
@SpringBootTest(properties = "interview.content.location=file:build/no-such-content/")
abstract class AbstractProgressTest {

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
    CatalogReader catalog;
    @Autowired
    ProgressService service;
    @Autowired
    ProgressReader reader;

    @TempDir
    Path tmp;
    ContentFixture fx;

    final UUID alice = UUID.randomUUID();
    final UUID bob = UUID.randomUUID();

    @BeforeEach
    void seed() {
        jdbc.execute("TRUNCATE user_progress, question_link, question, topic, category CASCADE");
        fx = new ContentFixture(tmp).category("c1").category("c2")
                .topic("c1", "t1", "aa", true).topic("c1", "t2", "bb", false).topic("c2", "t4", "dd", true)
                .question("c1", "t1", "aa-01", "질문 1", HEADER + "답 1.\n", "2026-10-20")
                .question("c1", "t1", "aa-02", "질문 2", HEADER + "답 2.\n", "2026-10-20")
                .question("c1", "t1", "aa-03", "질문 3", HEADER + "답 3.\n", "2026-10-20")
                .question("c1", "t1", "aa-04", "질문 4", HEADER + "답 4.\n", "2026-10-20")
                .question("c1", "t2", "bb-01", "비공개 주제의 질문", HEADER + "초안.\n")
                .question("c2", "t4", "dd-01", "질문 d1", HEADER + "답 d1.\n", "2026-10-20")
                .question("c2", "t4", "dd-02", "질문 d2", HEADER + "답 d2.\n", "2026-10-20");
        loader.load(fx.location());
    }

    void retireAa04() {
        fx.delete("c1", "t1", "aa-04");
        loader.load(fx.location());
    }

    int rows() {
        return jdbc.queryForObject("select count(*) from user_progress", Integer.class);
    }

    int rows(UUID user) {
        return jdbc.queryForObject("select count(*) from user_progress where user_id = ?", Integer.class, user);
    }

    static List<String> list(String... s) {
        return List.of(s);
    }
}
