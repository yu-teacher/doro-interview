package com.doro.interview.reminder;

import com.doro.interview.common.exception.ErrorCode;
import com.doro.interview.common.exception.InterviewException;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * 이 기기에서 복습 알림 받기/끄기. 사용자 대신 알림 서비스의 위임 API 를 부른다(사용자 id 는 호출하는 쪽이 토큰에서 얻은 값만 넘긴다).
 * 기능이 꺼져 있으면(호출자 토큰 없음) {@link #config()} 가 사용 불가를 알리고 나머지는 503 이다.
 */
@Service
public class PushSettings {

    /** 웹이 구독할 때 쓰는 값. available 이 false 면 화면에서 알림 설정을 감춘다. */
    public record Config(boolean available, String publicKey) {
    }

    /** 시험 알림 결과: 이 앱으로 등록된 기기 수와 그중 바로 보낸 수. */
    public record TestResult(int devices, int delivered) {
    }

    private final ReminderProperties properties;
    private final NotifyClient notify;

    PushSettings(ReminderProperties properties, NotifyClient notify) {
        this.properties = properties;
        this.notify = notify;
    }

    public Config config() {
        if (!properties.enabled()) {
            return new Config(false, null);
        }
        try {
            NotifyClient.Reply reply = notify.get("/api/v1/notify/config");
            JsonNode data = reply.ok() ? reply.data() : null;
            if (data == null || !data.path("enabled").asBoolean(false) || data.path("publicKey").asString("").isBlank()) {
                return new Config(false, null);
            }
            return new Config(true, data.path("publicKey").asString());
        } catch (NotifyClient.UnreachableException e) {
            return new Config(false, null);
        }
    }

    public void subscribe(UUID userId, String endpoint, String p256dh, String auth, String userAgent) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("deviceId", deviceId(endpoint.strip()));
        body.put("endpoint", endpoint.strip());
        body.put("keys", Map.of("p256dh", p256dh, "auth", auth));
        require(call(() -> notify.put(NotifyClient.userPath(userId) + "/subscriptions", body, userAgent)));
    }

    public void unsubscribe(UUID userId, String endpoint) {
        require(call(() -> notify.delete(NotifyClient.userPath(userId) + "/subscriptions", Map.of("endpoint", endpoint.strip()))));
    }

    public TestResult test(UUID userId) {
        JsonNode data = require(call(() -> notify.post(NotifyClient.userPath(userId) + "/test", null))).data();
        return new TestResult(data == null ? 0 : data.path("devices").asInt(0), data == null ? 0 : data.path("delivered").asInt(0));
    }

    /** 기기 표식: 구독 주소의 해시(브라우저가 구독을 새로 만들면 다른 기기로 잡히고, 알림 서비스가 오래된 구독을 정리한다). */
    static String deviceId(String endpoint) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(endpoint.getBytes(StandardCharsets.UTF_8));
            return NotifyClient.APP + "-" + HexFormat.of().formatHex(digest, 0, 8);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private NotifyClient.Reply call(java.util.function.Supplier<NotifyClient.Reply> request) {
        if (!properties.enabled()) {
            throw new InterviewException(ErrorCode.PUSH_UNAVAILABLE);
        }
        try {
            return request.get();
        } catch (NotifyClient.UnreachableException e) {
            throw new InterviewException(ErrorCode.PUSH_UNAVAILABLE);
        }
    }

    /** 알림 서비스의 실패를 이 서비스의 오류로 바꾼다: 입력 문제(구독 주소 거절 등)는 400, 그 밖은 503. */
    private static NotifyClient.Reply require(NotifyClient.Reply reply) {
        if (reply.ok()) {
            return reply;
        }
        if (reply.status() == 400) {
            String message = reply.body() == null ? "" : reply.body().path("message").asString("");
            throw new InterviewException(ErrorCode.INVALID_INPUT, message.isBlank() ? "이 브라우저의 알림 구독을 등록하지 못했습니다." : message);
        }
        throw new InterviewException(ErrorCode.PUSH_UNAVAILABLE);
    }
}
