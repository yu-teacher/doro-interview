package com.doro.interview.progress;

import com.doro.interview.mine.read.MyQuestionDeleted;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/** 내 질문을 지우면 그 질문의 체크도 지운다(docs/M4-PLAN.md D9). 질문을 지우는 트랜잭션 안에서 동기로 돈다. */
@Component
class MyQuestionDeletedCleaner {

    private final JdbcTemplate jdbc;

    MyQuestionDeletedCleaner(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @EventListener
    void on(MyQuestionDeleted event) {
        jdbc.update("DELETE FROM user_progress WHERE user_id = ? AND question_slug = ?", event.userId(), event.slug());
    }
}
