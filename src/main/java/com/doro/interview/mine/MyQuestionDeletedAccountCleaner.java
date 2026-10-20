package com.doro.interview.mine;

import com.doro.interview.account.AccountDeleted;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * 탈퇴한 사용자의 내 질문을 지운다(docs/M4-PLAN.md D9). 탈퇴 처리와 같은 트랜잭션에서 동기로 돌아서 실패하면 무덤 표식까지 롤백된다.
 * 체크·시험 기록은 각 모듈의 탈퇴 리스너가 지운다.
 */
@Component
class MyQuestionDeletedAccountCleaner {

    private final JdbcTemplate jdbc;

    MyQuestionDeletedAccountCleaner(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @EventListener
    void on(AccountDeleted event) {
        jdbc.update("DELETE FROM my_question WHERE user_id = ?", event.userId());
    }
}
