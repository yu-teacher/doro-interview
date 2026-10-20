package com.doro.interview.mine;

import com.doro.interview.mine.read.MyQuestionReader;
import com.doro.interview.support.IsolatedSchema;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.util.List;
import java.util.UUID;

/** 내 질문 서비스 시험의 공통 기반(전용 스키마). */
@SpringBootTest(properties = "interview.content.location=file:build/no-such-content/")
abstract class AbstractMineTest {

    @DynamicPropertySource
    static void schema(DynamicPropertyRegistry registry) {
        String url = IsolatedSchema.createAndGetUrl();
        registry.add("spring.datasource.url", () -> url);
    }

    @Autowired
    JdbcTemplate jdbc;
    @Autowired
    MyQuestionService service;
    @Autowired
    MyQuestionReader reader;

    final UUID alice = UUID.randomUUID();
    final UUID bob = UUID.randomUUID();

    @BeforeEach
    void clean() {
        jdbc.execute("TRUNCATE my_question");
    }

    static MyQuestionService.Draft draft(String title) {
        return new MyQuestionService.Draft(title, "", List.of(), "BASIC", null);
    }

    int rows() {
        return jdbc.queryForObject("select count(*) from my_question", Integer.class);
    }
}
