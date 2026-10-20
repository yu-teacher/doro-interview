package com.doro.interview.quiz;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** V8: 시험 표의 제약(개수 범위, 결과 값, 답 길이, 같은 질문 한 번, 외래키 없음). 실패하는 문장은 트랜잭션을 망가뜨리므로 시험마다 하나만 쓴다. */
@SpringBootTest
@Transactional
class QuizSchemaTest {

    @Autowired
    JdbcTemplate jdbc;

    private UUID session(int planned) {
        UUID id = UUID.randomUUID();
        jdbc.update("insert into quiz_session (id, user_id, planned_count) values (?, ?, ?)", id, UUID.randomUUID(), planned);
        return id;
    }

    private void item(UUID session, int seq, String slug) {
        jdbc.update("insert into quiz_item (session_id, seq, question_slug) values (?, ?, ?)", session, seq, slug);
    }

    @Test
    void 표의_칸() {
        assertThat(columns("quiz_session")).containsExactly("finished_at", "id", "include_unlearned", "planned_count", "scope", "started_at", "user_id");
        assertThat(columns("quiz_item")).containsExactly("answer_text", "answered_at", "question_slug", "result", "seconds", "seq", "session_id");
        assertThat(columns("quiz_question_stats")).containsExactly("ask_count", "last_asked_at", "last_result", "miss_count", "question_slug", "user_id");
        assertThat(columns("user_pref")).containsExactly("include_unlearned_default", "user_id");
    }

    private List<String> columns(String table) {
        return jdbc.queryForList("select column_name from information_schema.columns where table_name = ? and table_schema = current_schema() order by column_name", String.class, table);
    }

    @Test
    void 다른_표를_가리키는_외래키가_없다() {
        Integer fks = jdbc.queryForObject("select count(*) from information_schema.table_constraints where table_name in ('quiz_session','quiz_item','quiz_question_stats','user_pref') and table_schema = current_schema() and constraint_type = 'FOREIGN KEY'", Integer.class);
        assertThat(fks).isZero();
    }

    @Test
    void 개수는_1에서_30까지다() {
        session(1);
        session(30);
        assertThatThrownBy(() -> session(31)).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void 개수_0은_거부된다() {
        assertThatThrownBy(() -> session(0)).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void 결과는_세_값과_비어_있음만_허용한다() {
        UUID s = session(5);
        item(s, 1, "a-01");
        for (String ok : new String[]{"CORRECT", "WRONG", "SKIPPED"}) {
            jdbc.update("update quiz_item set result = ? where session_id = ? and seq = 1", ok, s);
        }
        jdbc.update("update quiz_item set result = null where session_id = ? and seq = 1", s);
    }

    @Test
    void 알_수_없는_결과는_거부된다() {
        UUID s = session(5);
        item(s, 1, "a-01");
        assertThatThrownBy(() -> jdbc.update("update quiz_item set result = 'MAYBE' where session_id = ? and seq = 1", s)).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void 같은_세션에서_같은_질문은_한_번만() {
        UUID s = session(5);
        item(s, 1, "a-01");
        assertThatThrownBy(() -> item(s, 2, "a-01")).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void 같은_순번은_한_번만() {
        UUID s = session(5);
        item(s, 1, "a-01");
        assertThatThrownBy(() -> item(s, 1, "a-02")).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void 다른_세션에서는_같은_질문이_나올_수_있다() {
        item(session(5), 1, "a-01");
        item(session(5), 1, "a-01");
    }

    @Test
    void 내_답은_1에서_2000자_코드포인트까지다() {
        UUID s = session(5);
        item(s, 1, "a-01");
        jdbc.update("update quiz_item set answer_text = ? where session_id = ? and seq = 1", "😀".repeat(2000), s);
        assertThatThrownBy(() -> jdbc.update("update quiz_item set answer_text = ? where session_id = ? and seq = 1", "가".repeat(2001), s)).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void 빈_답은_거부된다() {
        UUID s = session(5);
        item(s, 1, "a-01");
        assertThatThrownBy(() -> jdbc.update("update quiz_item set answer_text = '' where session_id = ? and seq = 1", s)).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void 통계는_틀린_횟수가_출제_횟수를_넘을_수_없다() {
        UUID u = UUID.randomUUID();
        jdbc.update("insert into quiz_question_stats (user_id, question_slug, ask_count, miss_count, last_result) values (?, 'a-01', 3, 3, 'WRONG')", u);
        assertThatThrownBy(() -> jdbc.update("insert into quiz_question_stats (user_id, question_slug, ask_count, miss_count) values (?, 'a-02', 1, 2)", u))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void 통계의_마지막_결과는_맞음_틀림만() {
        UUID u = UUID.randomUUID();
        assertThatThrownBy(() -> jdbc.update("insert into quiz_question_stats (user_id, question_slug, ask_count, last_result) values (?, 'a-01', 1, 'SKIPPED')", u))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void 기본_설정은_미학습_포함_꺼짐() {
        UUID u = UUID.randomUUID();
        jdbc.update("insert into user_pref (user_id) values (?)", u);
        assertThat(jdbc.queryForObject("select include_unlearned_default from user_pref where user_id = ?", Boolean.class, u)).isFalse();
    }
}
