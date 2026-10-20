package com.doro.interview.mine;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** V9: 내 질문 표의 칸·제약. 다른 표를 가리키는 외래키가 없고, 길이·난이도는 DB 가 한 번 더 막는다. */
@SpringBootTest
@Transactional
class MineSchemaTest {

    @Autowired
    JdbcTemplate jdbc;

    private int insert(String title, String answer, String tier, String source) {
        return jdbc.update("insert into my_question (id, user_id, title, answer_text, tier, source_label) values (?, ?, ?, ?, ?, ?)",
                UUID.randomUUID(), UUID.randomUUID(), title, answer, tier, source);
    }

    @Test
    void 칸은_정해진_것뿐이다() {
        var columns = jdbc.queryForList("select column_name from information_schema.columns where table_name = 'my_question' and table_schema = current_schema() order by column_name", String.class);
        assertThat(columns).containsExactly("answer_text", "created_at", "id", "keywords", "source_label", "tier", "title", "updated_at", "user_id");
    }

    @Test
    void 정상_값은_들어간다() {
        assertThat(insert("제목", "", "BASIC", null)).isOne();
        assertThat(insert("가".repeat(200), "나".repeat(4000), "TRICKY", "강사 추천")).isOne();
    }

    // 한 시험에 위반을 하나만 둔다: 위반이 나면 트랜잭션이 중단되어 뒤의 문장은 다른 오류로 실패한다.
    @Test
    void 제목은_비울_수_없다() {
        assertThatThrownBy(() -> insert("", "", "BASIC", null)).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void 제목은_200자_이하다() {
        assertThatThrownBy(() -> insert("가".repeat(201), "", "BASIC", null)).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void 답은_4000자_이하다() {
        assertThatThrownBy(() -> insert("제목", "가".repeat(4001), "BASIC", null)).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void 난이도는_세_값뿐이다() {
        assertThatThrownBy(() -> insert("제목", "", "EASY", null)).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void 출처_표시는_빈_문자열일_수_없다() {
        assertThatThrownBy(() -> insert("제목", "", "BASIC", "")).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void 출처_표시는_40자_이하다() {
        assertThatThrownBy(() -> insert("제목", "", "BASIC", "가".repeat(41))).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void 같은_id_는_두_번_들어갈_수_없다() {
        UUID id = UUID.randomUUID();
        jdbc.update("insert into my_question (id, user_id, title, tier) values (?, ?, 't', 'BASIC')", id, UUID.randomUUID());
        assertThatThrownBy(() -> jdbc.update("insert into my_question (id, user_id, title, tier) values (?, ?, 't', 'BASIC')", id, UUID.randomUUID()))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void 다른_표를_가리키는_외래키가_없다() {
        Integer fks = jdbc.queryForObject("select count(*) from information_schema.table_constraints where table_name = 'my_question' and table_schema = current_schema() and constraint_type = 'FOREIGN KEY'", Integer.class);
        assertThat(fks).isZero();
    }

    @Test
    void slug_는_질문_표의_열_길이_안에_들어간다() {
        // my-<UUID> = 39자. 체크·시험·통계의 question_slug 는 VARCHAR(60)
        assertThat(("my-" + UUID.randomUUID()).length()).isLessThanOrEqualTo(60);
    }
}
