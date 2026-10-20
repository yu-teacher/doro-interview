package com.doro.interview.quiz;

import com.doro.interview.mine.read.MyQuestionDeleted;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * 내 질문을 지우면 그 질문의 시험 통계를 지운다(docs/M4-PLAN.md D9). 지난 시험 문항(quiz_item)은 남긴다: 질문이 사라진 문항은
 * 제목 없이 나가고 건너뛰기만 할 수 있어(M3) 기록이 깨지지 않는다.
 */
@Component
class MyQuestionDeletedStatsCleaner {

    private final JdbcTemplate jdbc;

    MyQuestionDeletedStatsCleaner(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @EventListener
    void on(MyQuestionDeleted event) {
        jdbc.update("DELETE FROM quiz_question_stats WHERE user_id = ? AND question_slug = ?", event.userId(), event.slug());
    }
}
