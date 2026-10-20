package com.doro.interview.account;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** V4: 사용자 사본은 id 와 시각만 갖는다(개인정보 칸이 없다). */
@SpringBootTest
@Transactional
class AccountSchemaTest {

    @Autowired
    JdbcTemplate jdbc;

    @Test
    void 개인정보_칸이_없다() {
        var columns = jdbc.queryForList("select column_name from information_schema.columns where table_name = 'interview_user' and table_schema = current_schema() order by column_name", String.class);
        assertThat(columns).containsExactly("created_at", "deleted_at", "user_id");
    }

    @Test
    void 만들_때_시각이_채워지고_탈퇴_표식은_비어_있다() {
        UUID id = UUID.randomUUID();
        jdbc.update("insert into interview_user (user_id) values (?)", id);
        assertThat(jdbc.queryForObject("select created_at is not null and deleted_at is null from interview_user where user_id = ?", Boolean.class, id)).isTrue();
    }

    @Test
    void 같은_사용자는_두_번_들어갈_수_없다() {
        UUID id = UUID.randomUUID();
        jdbc.update("insert into interview_user (user_id) values (?)", id);
        assertThatThrownBy(() -> jdbc.update("insert into interview_user (user_id) values (?)", id)).isInstanceOf(DuplicateKeyException.class);
    }
}
