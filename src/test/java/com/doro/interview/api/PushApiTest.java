package com.doro.interview.api;

import com.doro.interview.account.AbstractAuthTest;
import com.doro.interview.support.FakeNotify;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** 복습 알림 설정 API: 로그인 필요, 사용자 대신 알림 서비스의 위임 API 를 부른다(사용자 id 는 토큰에서만), 입력 검증, 알림 서비스 실패의 변환. */
class PushApiTest extends AbstractAuthTest {

    static final FakeNotify NOTIFY = new FakeNotify();
    static final String SUBSCRIPTION = "{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/abc\",\"keys\":{\"p256dh\":\"BP256dh_key-1\",\"auth\":\"auth_key-1\"}}";

    @DynamicPropertySource
    static void notify(DynamicPropertyRegistry registry) {
        registry.add("interview.reminder.notify-base-url", NOTIFY::url);
        registry.add("interview.reminder.service-token", () -> FakeNotify.TOKEN);
    }

    @AfterAll
    static void stopNotify() {
        NOTIFY.stop();
    }

    final UUID alice = UUID.randomUUID();

    @BeforeEach
    void resetNotify() {
        NOTIFY.reset();
    }

    ResultActions as(UUID user, MockHttpServletRequestBuilder request) throws Exception {
        if (user != null) {
            request.header(HttpHeaders.AUTHORIZATION, "Bearer " + DORO.token(user));
        }
        return mvc.perform(request.contentType(MediaType.APPLICATION_JSON));
    }

    @Test
    @DisplayName("로그인하지 않으면 전부 401 이고 알림 서비스를 부르지 않는다")
    void requiresLogin() throws Exception {
        as(null, get("/api/v1/me/push")).andExpect(status().isUnauthorized());
        as(null, put("/api/v1/me/push/subscription").content(SUBSCRIPTION)).andExpect(status().isUnauthorized());
        as(null, put("/api/v1/me/push/unsubscribe").content("{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/abc\"}")).andExpect(status().isUnauthorized());
        as(null, put("/api/v1/me/push/test")).andExpect(status().isUnauthorized());
        assertThat(NOTIFY.requests()).isEmpty();
    }

    @Test
    @DisplayName("설정: 알림 서비스의 VAPID 공개 키를 돌려주고 저장하지 않게 한다")
    void config() throws Exception {
        as(alice, get("/api/v1/me/push")).andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store"))
                .andExpect(jsonPath("$.data.available").value(true))
                .andExpect(jsonPath("$.data.publicKey").value("BFakePublicKey"));
    }

    @Test
    @DisplayName("구독: 토큰의 사용자로 interview 앱 위임 API 를 부르고, 기기 표식은 구독 주소의 해시다")
    void subscribe() throws Exception {
        as(alice, put("/api/v1/me/push/subscription").content(SUBSCRIPTION).header(HttpHeaders.USER_AGENT, "TestBrowser/1"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.subscribed").value(true));

        FakeNotify.Request sent = NOTIFY.requests("PUT", "/internal/v1/apps/interview/users/").getFirst();
        assertThat(sent.path()).isEqualTo("/internal/v1/apps/interview/users/" + alice + "/subscriptions");
        assertThat(sent.token()).isEqualTo(FakeNotify.TOKEN);
        assertThat(sent.userAgent()).isEqualTo("TestBrowser/1");
        assertThat(sent.body()).contains("\"deviceId\":\"interview-").contains("https://fcm.googleapis.com/fcm/send/abc").contains("BP256dh_key-1");
    }

    @Test
    @DisplayName("끄기·시험 알림도 토큰의 사용자로 부른다")
    void unsubscribeAndTest() throws Exception {
        as(alice, put("/api/v1/me/push/unsubscribe").content("{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/abc\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.subscribed").value(false));
        assertThat(NOTIFY.requests("DELETE", "/internal/v1/apps/interview/users/" + alice + "/subscriptions")).hasSize(1);

        as(alice, put("/api/v1/me/push/test")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.devices").value(2)).andExpect(jsonPath("$.data.delivered").value(1));
        assertThat(NOTIFY.requests("POST", "/internal/v1/apps/interview/users/" + alice + "/test")).hasSize(1);
    }

    @Test
    @DisplayName("잘못된 구독(https 아님, 키 없음·이상한 문자, 본문 없음)은 400 이고 알림 서비스를 부르지 않는다")
    void rejectsBadSubscription() throws Exception {
        String[] bad = {
                "{\"endpoint\":\"http://fcm.googleapis.com/x\",\"keys\":{\"p256dh\":\"a\",\"auth\":\"b\"}}",
                "{\"endpoint\":\"https://fcm.googleapis.com/x\"}",
                "{\"endpoint\":\"https://fcm.googleapis.com/x\",\"keys\":{\"p256dh\":\"a b\",\"auth\":\"b\"}}",
                "{\"endpoint\":\"https://fcm.googleapis.com/x\",\"keys\":{\"p256dh\":\"a\",\"auth\":\"\"}}",
                "{}"};
        for (String body : bad) {
            as(alice, put("/api/v1/me/push/subscription").content(body)).andExpect(status().isBadRequest());
        }
        as(alice, put("/api/v1/me/push/unsubscribe").content("{\"endpoint\":\"ftp://x\"}")).andExpect(status().isBadRequest());
        assertThat(NOTIFY.requests()).isEmpty();
    }

    @Test
    @DisplayName("알림 서비스가 입력을 거절하면 400, 내려가 있으면 503, 설정은 사용 불가로 보인다")
    void mapsNotifyFailures() throws Exception {
        NOTIFY.failWith(400);
        as(alice, put("/api/v1/me/push/subscription").content(SUBSCRIPTION)).andExpect(status().isBadRequest());
        NOTIFY.failWith(500);
        as(alice, put("/api/v1/me/push/subscription").content(SUBSCRIPTION)).andExpect(status().isServiceUnavailable());
        as(alice, put("/api/v1/me/push/test")).andExpect(status().isServiceUnavailable());
        as(alice, get("/api/v1/me/push")).andExpect(status().isOk()).andExpect(jsonPath("$.data.available").value(false));
    }
}
