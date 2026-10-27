package com.doro.interview.account;

import com.doro.interview.common.exception.ErrorCode;
import com.doro.interview.common.exception.InterviewException;
import com.hunnit_beasts.doro.sdk.domain.DoroUser;
import com.hunnit_beasts.doro.sdk.domain.DoroUserContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** CurrentUser 의 세 가지 읽기 방식(읽기 전용 id, 활성화, 필수)이 익명·로그인·탈퇴에서 어떻게 다른지. */
class CurrentUserTest extends AbstractAuthTest {

    @Autowired
    CurrentUser currentUser;

    @AfterEach
    void clear() {
        DoroUserContext.clear();
    }

    private void login(UUID id) {
        DoroUserContext.setCurrentUser(new DoroUser(id, "user@example.test", UUID.randomUUID(), 0));
    }

    private void markDeleted(UUID id) {
        jdbc.update("insert into interview_user (user_id, deleted_at) values (?, now())", id);
    }

    @Test
    void 익명은_모두_빈_값이고_필수는_401이다() {
        assertThat(currentUser.id()).isEmpty();
        assertThat(currentUser.activate()).isEmpty();
        assertThatThrownBy(() -> currentUser.require())
                .isInstanceOfSatisfying(InterviewException.class, e -> assertThat(e.errorCode()).isEqualTo(ErrorCode.UNAUTHORIZED));
        assertThat(userRows()).isZero();
    }

    @Test
    void id는_읽기_전용이라_행을_만들지_않는다() {
        UUID id = UUID.randomUUID();
        login(id);
        assertThat(currentUser.id()).contains(id);
        assertThat(userRows()).isZero();
    }

    @Test
    void activate는_행이_없으면_만들고_두_번째는_그대로다() {
        UUID id = UUID.randomUUID();
        login(id);
        assertThat(currentUser.activate()).contains(id);
        assertThat(currentUser.activate()).contains(id);
        assertThat(userRows()).isEqualTo(1);
    }

    @Test
    void require는_로그인한_사용자의_id를_주고_행을_만든다() {
        UUID id = UUID.randomUUID();
        login(id);
        assertThat(currentUser.require()).isEqualTo(id);
        assertThat(userRows()).isEqualTo(1);
    }

    @Test
    void 탈퇴한_사용자는_id_activate가_비고_require는_401이며_되살아나지_않는다() {
        UUID id = UUID.randomUUID();
        markDeleted(id);
        login(id);
        assertThat(currentUser.id()).isEmpty();
        assertThat(currentUser.activate()).isEmpty();
        assertThatThrownBy(() -> currentUser.require()).isInstanceOf(InterviewException.class);
        assertThat(jdbc.queryForObject("select deleted_at is not null from interview_user where user_id = ?", Boolean.class, id)).isTrue();
        assertThat(userRows()).isEqualTo(1);
    }

    @Test
    void isAdmin은_ADMIN과_SUPER_ADMIN만_true이고_익명_탈퇴는_false다() {
        UUID id = UUID.randomUUID();
        assertThat(currentUser.isAdmin()).isFalse();
        for (String role : new String[]{"ADMIN", "SUPER_ADMIN"}) {
            DoroUserContext.setCurrentUser(new DoroUser(id, "a@example.test", UUID.randomUUID(), 0, role));
            assertThat(currentUser.isAdmin()).as(role).isTrue();
        }
        DoroUserContext.setCurrentUser(new DoroUser(id, "a@example.test", UUID.randomUUID(), 0, "USER"));
        assertThat(currentUser.isAdmin()).isFalse();
        markDeleted(id);
        DoroUserContext.setCurrentUser(new DoroUser(id, "a@example.test", UUID.randomUUID(), 0, "ADMIN"));
        assertThat(currentUser.isAdmin()).isFalse();
    }

    @Test
    void 사용자_id가_없는_인증은_익명이다() {
        DoroUserContext.setCurrentUser(new DoroUser(null, "anonymous", null, 0, "ANON", null));
        assertThat(currentUser.id()).isEmpty();
        assertThat(currentUser.activate()).isEmpty();
    }
}
