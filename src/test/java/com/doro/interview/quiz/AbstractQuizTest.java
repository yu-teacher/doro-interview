package com.doro.interview.quiz;

import com.doro.interview.catalog.content.ContentLoader;
import com.doro.interview.progress.ProgressService;
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
 * 시험 서비스 시험의 공통 데이터(전용 스키마, 임시 content/).
 *
 * <pre>
 * c1 / t1  공개   aa-01 BASIC · aa-02 BASIC · aa-03 DEEP · aa-04 TRICKY
 * c1 / t2  비공개  bb-01
 * c2 / t4  공개   dd-01 BASIC · dd-02 DEEP
 * </pre>
 */
@SpringBootTest(properties = "interview.content.location=file:build/no-such-content/")
abstract class AbstractQuizTest {

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
    QuizService quiz;
    @Autowired
    ProgressService progress;

    @TempDir
    Path tmp;
    ContentFixture fx;

    final UUID alice = UUID.randomUUID();
    final UUID bob = UUID.randomUUID();

    @BeforeEach
    void seed() {
        jdbc.execute("TRUNCATE my_question, quiz_item, quiz_session, quiz_question_stats, user_pref, user_progress, my_note, question_link, question, topic, category CASCADE");
        fx = new ContentFixture(tmp).category("c1").category("c2")
                .topic("c1", "t1", "aa", true).topic("c1", "t2", "bb", false).topic("c2", "t4", "dd", true)
                .questionFull("c1", "t1", "aa-01", "BASIC", "질문 1", HEADER + "답 1.\n", "2026-10-20", List.of())
                .questionFull("c1", "t1", "aa-02", "BASIC", "질문 2", HEADER + "답 2.\n", "2026-10-20", List.of())
                .questionFull("c1", "t1", "aa-03", "DEEP", "질문 3", HEADER + "답 3.\n", "2026-10-20", List.of())
                .questionFull("c1", "t1", "aa-04", "TRICKY", "질문 4", HEADER + "답 4.\n", "2026-10-20", List.of())
                .question("c1", "t2", "bb-01", "비공개 주제의 질문", HEADER + "초안.\n")
                .questionFull("c2", "t4", "dd-01", "BASIC", "질문 d1", HEADER + "답 d1.\n", "2026-10-20", List.of())
                .questionFull("c2", "t4", "dd-02", "DEEP", "질문 d2", HEADER + "답 d2.\n", "2026-10-20", List.of());
        loader.load(fx.location());
    }

    void learn(UUID user, String... slugs) {
        for (String slug : slugs) {
            progress.setLearned(user, slug, true);
        }
    }

    void retire(String category, String topic, String slug) {
        fx.delete(category, topic, slug);
        loader.load(fx.location());
    }

    int count(String sql, Object... args) {
        return jdbc.queryForObject(sql, Integer.class, args);
    }
}
