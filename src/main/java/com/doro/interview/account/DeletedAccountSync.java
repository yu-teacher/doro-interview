package com.doro.interview.account;

import com.hunnit_beasts.doro.sdk.sync.DeletedUserHandler;
import com.hunnit_beasts.doro.sdk.sync.DeletedUsersProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * Doro 의 영구 탈퇴 사용자 목록을 주기적으로 가져와 이 서비스의 사용자 데이터를 지운다. 가져오기·재시도·진행 위치 관리는 SDK 가
 * 하고(자동 구성: 아래 세 빈이 있으면 켜진다), 이 서비스는 "한 사용자를 어떻게 정리하는가" 만 정한다(docs/M2-PLAN.md S7).
 * 설정은 {@code interview.deleted-sync.*}, IAM 주소·서비스 토큰은 {@code doro.iam.internal-url/-token}(토큰은 환경변수로만).
 */
@Configuration
@EnableScheduling
class DeletedAccountSync {

    @Bean
    @ConfigurationProperties(prefix = "interview.deleted-sync")
    DeletedUsersProperties deletedUsersProperties() {
        return new DeletedUsersProperties();
    }

    @Bean
    DeletedUserHandler deletedUserHandler(AccountService accounts, ApplicationEventPublisher events) {
        return new Handler(accounts, events);
    }

    /**
     * 한 사용자의 정리. 무덤 표식과 이벤트 리스너들의 삭제가 **한 트랜잭션**이다: 어느 하나라도 실패하면 표식도 남지 않아
     * 다음 주기에 같은 사용자부터 다시 처리된다. 이미 정리된 사용자는 아무것도 하지 않고 false 를 돌려준다(멱등).
     */
    static class Handler implements DeletedUserHandler {

        private final AccountService accounts;
        private final ApplicationEventPublisher events;

        Handler(AccountService accounts, ApplicationEventPublisher events) {
            this.accounts = accounts;
            this.events = events;
        }

        @Override
        @Transactional
        public boolean onDeleted(UUID userId, Instant deletedAt) {
            if (!accounts.markDeleted(userId)) {
                return false;
            }
            events.publishEvent(new AccountDeleted(userId, deletedAt));
            return true;
        }
    }
}
