package com.doro.interview.reminder;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ReminderPropertiesTest {

    @Test
    @DisplayName("호출자 토큰이 비어 있으면 꺼지고, 토큰은 문자열 표현에 나오지 않는다")
    void enabledOnlyWithTokenAndNeverPrintsIt() {
        ReminderProperties p = new ReminderProperties();
        assertThat(p.enabled()).isFalse();
        p.setServiceToken("  ");
        assertThat(p.enabled()).isFalse();
        p.setServiceToken("secret-token-value");
        assertThat(p.enabled()).isTrue();
        assertThat(p.toString()).doesNotContain("secret-token-value");
    }

    @Test
    @DisplayName("공개 경로는 앞뒤 슬래시를 정리해 '/…/' 모양으로 쓴다")
    void normalizesScopePath() {
        ReminderProperties p = new ReminderProperties();
        assertThat(p.scopePath()).isEqualTo("/interview/");
        p.setWebBasePath("dev/interview/");
        assertThat(p.scopePath()).isEqualTo("/dev/interview/");
        p.setWebBasePath("/dev/interview");
        assertThat(p.scopePath()).isEqualTo("/dev/interview/");
        p.setWebBasePath("");
        assertThat(p.scopePath()).isEqualTo("/interview/");
    }

    @Test
    @DisplayName("기기 표식은 구독 주소의 해시로 만들고 알림 서비스의 형식(8~64자, 영숫자·-·_)에 맞는다")
    void deviceIdShape() {
        String id = PushSettings.deviceId("https://fcm.googleapis.com/fcm/send/abc");
        assertThat(id).matches("^[A-Za-z0-9_-]{8,64}$").startsWith("interview-");
        assertThat(PushSettings.deviceId("https://fcm.googleapis.com/fcm/send/abc")).isEqualTo(id);
        assertThat(PushSettings.deviceId("https://fcm.googleapis.com/fcm/send/abd")).isNotEqualTo(id);
    }
}
