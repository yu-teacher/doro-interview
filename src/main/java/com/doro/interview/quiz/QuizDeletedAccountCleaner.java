package com.doro.interview.quiz;

import com.doro.interview.account.AccountDeleted;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * 탈퇴한 사용자의 시험 기록(세션·문항·내 답·통계·설정)을 지운다(docs/M2-PLAN.md D11, DESIGN §10). 탈퇴 처리와 같은 트랜잭션에서 동기로 돌아서,
 * 실패하면 무덤 표식까지 롤백되어 다음 주기에 다시 시도된다.
 */
@Component
class QuizDeletedAccountCleaner {

    private final JdbcTemplate jdbc;

    QuizDeletedAccountCleaner(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @EventListener
    void on(AccountDeleted event) {
        jdbc.update("DELETE FROM quiz_feedback WHERE user_id = ?", event.userId());
        jdbc.update("DELETE FROM quiz_item WHERE session_id IN (SELECT id FROM quiz_session WHERE user_id = ?)", event.userId());
        jdbc.update("DELETE FROM quiz_session WHERE user_id = ?", event.userId());
        jdbc.update("DELETE FROM quiz_question_stats WHERE user_id = ?", event.userId());
        jdbc.update("DELETE FROM user_pref WHERE user_id = ?", event.userId());
    }
}
