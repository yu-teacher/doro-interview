package com.doro.interview.progress;

import com.doro.interview.account.ProgressReset;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/** "내 현황 초기화": 학습 체크(user_progress)만 지운다. 노트(my_note)는 사용자가 쓴 글이라 남긴다. */
@Component
class ProgressResetCleaner {

    private final JdbcTemplate jdbc;

    ProgressResetCleaner(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @EventListener
    void on(ProgressReset event) {
        jdbc.update("DELETE FROM user_progress WHERE user_id = ?", event.userId());
    }
}
