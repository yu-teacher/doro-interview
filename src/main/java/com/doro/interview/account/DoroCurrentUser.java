package com.doro.interview.account;

import com.doro.interview.common.exception.ErrorCode;
import com.doro.interview.common.exception.InterviewException;
import com.hunnit_beasts.doro.sdk.domain.DoroUser;
import com.hunnit_beasts.doro.sdk.domain.DoroUserContext;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

/**
 * {@link CurrentUser} 의 SDK 구현: SDK 의 JWT 필터가 요청 스레드에 올려 둔 사용자(`DoroUserContext`)를 읽는다.
 * 이 클래스가 Doro SDK 를 import 하는 유일한 서비스 코드다(ArchUnit R1). 필터는 잘못된·만료된 토큰을 예외 없이 익명으로 취급한다.
 */
@Component
class DoroCurrentUser implements CurrentUser {

    private final AccountService accounts;

    DoroCurrentUser(AccountService accounts) {
        this.accounts = accounts;
    }

    private static Optional<UUID> authenticatedId() {
        DoroUser user = DoroUserContext.getCurrentUser();
        return user != null && user.isAuthenticated() ? Optional.of(user.userId()) : Optional.empty();
    }

    @Override
    public Optional<UUID> id() {
        return authenticatedId().filter(accounts::isActive);
    }

    @Override
    public Optional<UUID> activate() {
        return authenticatedId().filter(accounts::ensureActive);
    }

    @Override
    public boolean isAdmin() {
        DoroUser user = DoroUserContext.getCurrentUser();
        return user != null && user.isAdmin() && id().isPresent();
    }

    @Override
    public UUID require() {
        return activate().orElseThrow(() -> new InterviewException(ErrorCode.UNAUTHORIZED));
    }
}
