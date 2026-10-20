package com.doro.interview.account;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.doro.interview.support.FakeIamInternal;
import com.doro.interview.support.IsolatedSchema;
import com.hunnit_beasts.doro.sdk.sync.DeletedUserHandler;
import com.hunnit_beasts.doro.sdk.sync.DeletedUsersClient;
import com.hunnit_beasts.doro.sdk.sync.DeletedUsersProperties;
import com.hunnit_beasts.doro.sdk.sync.DeletedUsersSync;
import com.hunnit_beasts.doro.sdk.sync.SyncCursorStore;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.time.Clock;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * 탈퇴 동기화(docs/M2-PLAN.md S7): SDK 가 가짜 IAM 의 내부 API 를 호출해 우리 핸들러까지 가고, 그 사용자의 체크·노트가 지워진다.
 * 핸들러는 멱등이고, 방문한 적 없는 사용자도 무덤 표식을 남기며, 다른 사용자의 데이터는 건드리지 않는다.
 */
@SpringBootTest(properties = "interview.content.location=file:build/no-such-content/")
class DeletedAccountSyncTest {

    private static final FakeIamInternal IAM = new FakeIamInternal();

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        String url = IsolatedSchema.createAndGetUrl();
        registry.add("spring.datasource.url", () -> url);
        registry.add("doro.iam.internal-url", IAM::url);
        registry.add("doro.iam.internal-token", () -> FakeIamInternal.TOKEN);
    }

    @AfterAll
    static void stop() {
        IAM.close();
    }

    @Autowired
    JdbcTemplate jdbc;
    @Autowired
    DeletedUsersSync sync;
    @Autowired
    DeletedUserHandler handler;
    @Autowired
    AccountService accounts;
    @Autowired
    SyncCursorStore cursors;
    @Autowired
    DeletedUsersProperties props;

    final UUID alice = UUID.randomUUID();
    final UUID bob = UUID.randomUUID();
    final UUID carol = UUID.randomUUID(); // 방문한 적 없는 사용자

    @BeforeEach
    void seed() {
        IAM.clear();
        jdbc.execute("TRUNCATE interview_user, user_progress, my_note, iam_sync_state");
        for (UUID u : new UUID[]{alice, bob}) {
            jdbc.update("insert into interview_user (user_id) values (?)", u);
            jdbc.update("insert into user_progress (user_id, question_slug) values (?, 'aa-01'), (?, 'aa-02')", u, u);
            jdbc.update("insert into my_note (user_id, question_slug, body) values (?, 'aa-01', '메모')", u);
        }
    }

    private int count(String table, UUID user) {
        return jdbc.queryForObject("select count(*) from " + table + " where user_id = ?", Integer.class, user);
    }

    private boolean tombstoned(UUID user) {
        return Boolean.TRUE.equals(jdbc.query("select deleted_at is not null from interview_user where user_id = ?",
                rs -> rs.next() ? rs.getBoolean(1) : null, user));
    }

    // -- 핸들러

    @Test
    void 핸들러는_표식을_남기고_체크와_노트를_지우며_두_번째는_false다() {
        assertThat(handler.onDeleted(alice, Instant.now())).isTrue();
        assertThat(tombstoned(alice)).isTrue();
        assertThat(count("user_progress", alice)).isZero();
        assertThat(count("my_note", alice)).isZero();
        assertThat(handler.onDeleted(alice, Instant.now())).isFalse();
        assertThat(tombstoned(alice)).isTrue();
    }

    @Test
    void 다른_사용자의_데이터는_그대로다() {
        handler.onDeleted(alice, Instant.now());
        assertThat(count("user_progress", bob)).isEqualTo(2);
        assertThat(count("my_note", bob)).isEqualTo(1);
        assertThat(tombstoned(bob)).isFalse();
    }

    @Test
    void 방문한_적_없는_사용자도_표식이_남고_되살아나지_않는다() {
        assertThat(handler.onDeleted(carol, Instant.now())).isTrue();
        assertThat(tombstoned(carol)).isTrue();
        // 탈퇴 직후 아직 유효한 토큰의 첫 요청이 행을 새로 만들어 되살리는 경주를 막는다
        assertThat(accounts.ensureActive(carol)).isFalse();
        assertThat(accounts.isActive(carol)).isFalse();
        assertThat(tombstoned(carol)).isTrue();
        assertThat(count("interview_user", carol)).isEqualTo(1);
    }

    // -- SDK 동기화: 가짜 IAM → SDK → 우리 핸들러

    @Test
    void SDK_동기화가_IAM_내부_API를_호출해_핸들러까지_간다() {
        IAM.delete(alice, Instant.parse("2026-10-20T00:00:00Z"));
        IAM.delete(carol, Instant.parse("2026-10-20T00:01:00Z"));

        assertThat(sync.sync()).isEqualTo(2);

        assertThat(tombstoned(alice)).isTrue();
        assertThat(tombstoned(carol)).isTrue();
        assertThat(count("user_progress", alice)).isZero();
        assertThat(count("my_note", alice)).isZero();
        assertThat(count("user_progress", bob)).isEqualTo(2);
        assertThat(IAM.requestedSince()).isNotEmpty();
    }

    @Test
    void 같은_목록을_다시_받아도_결과는_같고_새로_정리한_수는_0이다() {
        IAM.delete(alice, Instant.parse("2026-10-20T00:00:00Z"));
        assertThat(sync.sync()).isEqualTo(1);
        assertThat(sync.sync()).isZero();
        assertThat(count("user_progress", bob)).isEqualTo(2);
    }

    @Test
    void 진행_위치는_DB에_저장되고_앞으로만_움직인다() {
        IAM.delete(alice, Instant.parse("2026-10-20T00:00:00Z"));
        sync.sync();
        Instant stored = cursors.get(props.getName()).orElseThrow();
        assertThat(stored).isBeforeOrEqualTo(Instant.parse("2026-10-20T00:00:00Z")); // 겹침(overlap)만큼 앞당겨 저장
        assertThat(stored).isAfter(Instant.parse("2026-10-19T00:00:00Z"));

        cursors.advance(props.getName(), stored.minusSeconds(3600)); // 더 이른 값은 무시
        assertThat(cursors.get(props.getName())).contains(stored);
        cursors.advance(props.getName(), stored.plusSeconds(60));
        assertThat(cursors.get(props.getName())).contains(stored.plusSeconds(60));
        assertThat(jdbc.queryForObject("select count(*) from iam_sync_state", Integer.class)).isEqualTo(1);
    }

    @Test
    void 처음에는_진행_위치가_없다() {
        assertThat(cursors.get("nobody")).isEmpty();
    }

    // -- 실패하는 경우(A5): 조용히 실패하지 않는다

    @Test
    void 서비스_토큰이_틀리거나_비면_호출이_거절되고_예외로_드러난다() {
        var client = new DeletedUsersClient(IAM.url(), "", props); // 토큰 없음
        var noToken = new DeletedUsersSync(client, handler, cursors, props, Clock.systemUTC());
        IAM.delete(alice, Instant.parse("2026-10-20T00:00:00Z"));
        assertThatThrownBy(noToken::sync).hasMessageContaining("401");
        assertThat(tombstoned(alice)).isFalse();
        assertThat(count("user_progress", alice)).isEqualTo(2);
    }

    @Test
    void 주기_실행은_실패해도_죽지_않고_경고를_남기며_다음_주기에_이어간다() {
        Logger logger = (Logger) LoggerFactory.getLogger(DeletedUsersSync.class);
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);
        props.setEnabled(true); // 시험 설정은 주기 실행을 꺼 둔다. 이 시험은 켠 상태의 한 번 실행을 직접 부른다
        try {
            IAM.delete(alice, Instant.parse("2026-10-20T00:00:00Z"));
            IAM.failWith(503);
            sync.scheduledRun(); // 던지지 않는다
            assertThat(appender.list).anySatisfy(e -> {
                assertThat(e.getLevel()).isEqualTo(Level.WARN);
                assertThat(e.getFormattedMessage()).contains("Deleted-account sync failed");
            });
            assertThat(tombstoned(alice)).isFalse();

            IAM.failWith(200); // IAM 이 돌아오면 같은 사용자부터 이어서 처리한다
            sync.scheduledRun();
            assertThat(tombstoned(alice)).isTrue();
        } finally {
            props.setEnabled(false);
            logger.detachAppender(appender);
        }
    }
}
