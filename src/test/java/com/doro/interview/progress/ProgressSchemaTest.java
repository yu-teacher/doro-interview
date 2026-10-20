package com.doro.interview.progress;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** V5: 체크 한 건 = (사용자, 질문 slug) 한 행. 질문·사용자 표에 외래키가 없다(모듈 사이 외래키 금지). */
@SpringBootTest
@Transactional
class ProgressSchemaTest {

    @Autowired
    JdbcTemplate jdbc;

    @Test
    void 칸은_사용자_질문_시각뿐이다() {
        var columns = jdbc.queryForList("select column_name from information_schema.columns where table_name = 'user_progress' and table_schema = current_schema() order by column_name", String.class);
        assertThat(columns).containsExactly("learned_at", "question_slug", "user_id");
    }

    @Test
    void 같은_사용자의_같은_질문은_두_번_들어갈_수_없다() {
        UUID id = UUID.randomUUID();
        jdbc.update("insert into user_progress (user_id, question_slug) values (?, 'x-01')", id);
        assertThatThrownBy(() -> jdbc.update("insert into user_progress (user_id, question_slug) values (?, 'x-01')", id))
                .isInstanceOf(DuplicateKeyException.class);
    }

    @Test
    void 다른_표를_가리키는_외래키가_없다() {
        Integer fks = jdbc.queryForObject("select count(*) from information_schema.table_constraints where table_name = 'user_progress' and table_schema = current_schema() and constraint_type = 'FOREIGN KEY'", Integer.class);
        assertThat(fks).isZero();
    }
}
