package com.doro.interview.progress;

import com.doro.interview.common.exception.ErrorCode;
import com.doro.interview.common.exception.InterviewException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** 노트의 두 겹 방어: 서비스 검사와 DB CHECK 가 따로 막는다(어느 한쪽이 빠져도 다른 쪽이 막는다). */
class NoteServiceTest extends AbstractProgressTest {

    @Autowired
    NoteService notes;

    private void insertRaw(String body) {
        jdbc.update("insert into my_note (user_id, question_slug, body) values (?, 'aa-01', ?)", UUID.randomUUID(), body);
    }

    @Test
    void 서비스는_상한_초과와_NUL을_예외로_막는다() {
        for (String bad : new String[]{"가".repeat(2001), "a\u0000"}) {
            assertThatThrownBy(() -> notes.put(alice, "aa-01", bad)).isInstanceOfSatisfying(InterviewException.class,
                    e -> assertThat(e.errorCode()).isEqualTo(ErrorCode.INVALID_INPUT));
        }
        assertThat(jdbc.queryForObject("select count(*) from my_note", Integer.class)).isZero();
    }

    @Test
    void DB_CHECK는_서비스를_거치지_않아도_길이를_막는다() {
        assertThatThrownBy(() -> insertRaw("")).isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> insertRaw("가".repeat(2001))).isInstanceOf(DataIntegrityViolationException.class);
        insertRaw("가".repeat(2000));
        insertRaw("😀".repeat(2000));
        assertThat(jdbc.queryForObject("select count(*) from my_note", Integer.class)).isEqualTo(2);
    }

    @Test
    void 보이지_않는_질문은_404다() {
        for (String slug : new String[]{"bb-01", "zz-99"}) {
            assertThatThrownBy(() -> notes.put(alice, slug, "x")).isInstanceOfSatisfying(InterviewException.class,
                    e -> assertThat(e.errorCode()).isEqualTo(ErrorCode.NOT_FOUND));
            assertThatThrownBy(() -> notes.get(alice, slug)).isInstanceOf(InterviewException.class);
        }
    }

    @Test
    void 덮어쓰면_시각이_갱신되고_행은_하나다() throws Exception {
        var first = notes.put(alice, "aa-01", "하나").orElseThrow();
        Thread.sleep(20);
        var second = notes.put(alice, "aa-01", "둘").orElseThrow();
        assertThat(second.updatedAt()).isAfter(first.updatedAt());
        assertThat(jdbc.queryForObject("select count(*) from my_note", Integer.class)).isEqualTo(1);
    }

    @Test
    void 사용자_A의_노트를_B가_읽지_못한다() {
        notes.put(alice, "aa-01", "비밀");
        assertThat(notes.get(bob, "aa-01")).isEmpty();
        assertThat(notes.get(alice, "aa-01")).isPresent();
    }
}
