package com.doro.interview;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class InterviewApplicationTest {

    @Autowired
    JdbcTemplate jdbc;

    @Test
    void 앱이_격리_Postgres_에서_기동한다() {
        assertThat(jdbc.queryForObject("select 1", Integer.class)).isEqualTo(1);
    }
}
