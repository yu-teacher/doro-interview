package com.doro.interview.progress;

import com.doro.interview.account.AccountDeleted;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * 탈퇴한 사용자의 학습 체크와 노트를 지운다(docs/M2-PLAN.md D11). 탈퇴 처리와 같은 트랜잭션에서 동기로 돌아서, 실패하면 탈퇴 표식까지
 * 롤백되어 다음 주기에 다시 시도된다. 사용자 id 외의 개인정보가 없으므로 지울 것은 이 두 표뿐이다.
 */
@Component
class DeletedAccountCleaner {

    private final JdbcTemplate jdbc;

    DeletedAccountCleaner(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @EventListener
    void on(AccountDeleted event) {
        jdbc.update("DELETE FROM user_progress WHERE user_id = ?", event.userId());
        jdbc.update("DELETE FROM my_note WHERE user_id = ?", event.userId());
    }
}
