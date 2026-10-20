package com.doro.interview.account;

import com.doro.interview.support.IsolatedSchema;
import com.hunnit_beasts.doro.sdk.sync.DeletedUserHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Import;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** 리스너가 실패하면 무덤 표식과 다른 리스너의 삭제까지 모두 롤백되어, 다음 주기에 같은 사용자부터 다시 처리된다. */
@SpringBootTest(properties = "interview.content.location=file:build/no-such-content/")
@Import(DeletedAccountRollbackTest.FailingListener.class)
class DeletedAccountRollbackTest {

    static final UUID POISON = UUID.randomUUID();
    static volatile boolean fail = true;

    @TestConfiguration
    static class FailingListener {
        @EventListener
        void on(AccountDeleted event) {
            if (fail && event.userId().equals(POISON)) {
                throw new IllegalStateException("리스너 실패");
            }
        }
    }

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        String url = IsolatedSchema.createAndGetUrl();
        registry.add("spring.datasource.url", () -> url);
    }

    @Autowired
    JdbcTemplate jdbc;
    @Autowired
    DeletedUserHandler handler;

    @BeforeEach
    void seed() {
        fail = true;
        jdbc.execute("TRUNCATE interview_user, user_progress, my_note");
        jdbc.update("insert into interview_user (user_id) values (?)", POISON);
        jdbc.update("insert into user_progress (user_id, question_slug) values (?, 'aa-01')", POISON);
        jdbc.update("insert into my_note (user_id, question_slug, body) values (?, 'aa-01', '메모')", POISON);
    }

    @Test
    void 리스너가_실패하면_표식도_삭제도_남지_않는다() {
        assertThatThrownBy(() -> handler.onDeleted(POISON, Instant.now())).hasMessageContaining("리스너 실패");
        assertThat(jdbc.queryForObject("select deleted_at is null from interview_user where user_id = ?", Boolean.class, POISON)).isTrue();
        assertThat(jdbc.queryForObject("select count(*) from user_progress where user_id = ?", Integer.class, POISON)).isEqualTo(1);
        assertThat(jdbc.queryForObject("select count(*) from my_note where user_id = ?", Integer.class, POISON)).isEqualTo(1);
    }

    @Test
    void 방문한_적_없는_사용자가_실패해도_표식_행이_남지_않는다() {
        UUID stranger = UUID.randomUUID();
        // 이 사용자는 POISON 이 아니라 실패하지 않는다: 대조군
        assertThat(handler.onDeleted(stranger, Instant.now())).isTrue();
        jdbc.execute("delete from interview_user where user_id = '" + POISON + "'");
        assertThatThrownBy(() -> handler.onDeleted(POISON, Instant.now())).isInstanceOf(IllegalStateException.class);
        assertThat(jdbc.queryForObject("select count(*) from interview_user where user_id = ?", Integer.class, POISON)).isZero();
    }

    @Test
    void 문제가_사라지면_다음_주기에_같은_사용자가_정상_처리된다() {
        assertThatThrownBy(() -> handler.onDeleted(POISON, Instant.now())).isInstanceOf(IllegalStateException.class);
        fail = false;
        assertThat(handler.onDeleted(POISON, Instant.now())).isTrue();
        assertThat(jdbc.queryForObject("select count(*) from user_progress where user_id = ?", Integer.class, POISON)).isZero();
        assertThat(jdbc.queryForObject("select count(*) from my_note where user_id = ?", Integer.class, POISON)).isZero();
    }
}
