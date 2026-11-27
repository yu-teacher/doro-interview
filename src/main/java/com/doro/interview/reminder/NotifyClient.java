package com.doro.interview.reminder;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.UUID;

/**
 * 플랫폼 알림 서비스(doro-notify)의 내부 API 를 부르는 클라이언트. 호출자 토큰으로 인증하고, 사용자의 기기·설정은 자기 앱({@value #APP})
 * 범위 안에서 대신 다룬다(사용자 id 는 호출하는 쪽이 토큰에서 얻은 값만 넘긴다). 응답 본문·구독 값·토큰은 로그에 남기지 않는다(상태 코드만).
 */
@Component
class NotifyClient {

    static final String APP = "interview";

    private static final Logger log = LoggerFactory.getLogger(NotifyClient.class);
    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(3);
    private static final Duration READ_TIMEOUT = Duration.ofSeconds(5);

    /** HTTP 응답. body 는 JSON 이면 파싱한 것(아니면 null). */
    record Reply(int status, JsonNode body) {
        boolean ok() {
            return status >= 200 && status < 300;
        }

        JsonNode data() {
            return body == null ? null : body.path("data");
        }
    }

    /** 알림 서비스에 닿지 못했다(연결 실패·시간 초과). */
    static class UnreachableException extends RuntimeException {
        UnreachableException(Throwable cause) {
            super("notify service unreachable: " + cause.getClass().getSimpleName());
        }
    }

    private final ReminderProperties properties;
    private final ObjectMapper json;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(CONNECT_TIMEOUT).followRedirects(HttpClient.Redirect.NEVER).build();

    NotifyClient(ReminderProperties properties, ObjectMapper json) {
        this.properties = properties;
        this.json = json;
    }

    Reply post(String path, Object body) {
        return call("POST", path, body, null);
    }

    Reply put(String path, Object body, String userAgent) {
        return call("PUT", path, body, userAgent);
    }

    Reply delete(String path, Object body) {
        return call("DELETE", path, body, null);
    }

    Reply get(String path) {
        return call("GET", path, null, null);
    }

    static String userPath(UUID userId) {
        return "/internal/v1/apps/" + APP + "/users/" + userId;
    }

    private Reply call(String method, String path, Object body, String userAgent) {
        try {
            HttpRequest.Builder request = HttpRequest.newBuilder(URI.create(properties.getNotifyBaseUrl() + path))
                    .timeout(READ_TIMEOUT)
                    .header("X-Doro-Service-Token", properties.getServiceToken());
            if (userAgent != null && !userAgent.isBlank()) {
                request.header("User-Agent", userAgent.length() > 300 ? userAgent.substring(0, 300) : userAgent);
            }
            if (body == null) {
                request.method(method, HttpRequest.BodyPublishers.noBody());
            } else {
                request.header("Content-Type", "application/json")
                        .method(method, HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body), StandardCharsets.UTF_8));
            }
            HttpResponse<String> response = http.send(request.build(), HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            JsonNode parsed = null;
            try {
                parsed = response.body() == null || response.body().isBlank() ? null : json.readTree(response.body());
            } catch (RuntimeException ignored) {
                // JSON 이 아닌 응답: 상태 코드만 쓴다
            }
            if (!(response.statusCode() >= 200 && response.statusCode() < 300)) {
                log.warn("notify {} {} -> {}", method, path.replaceAll("/users/[^/]+", "/users/*"), response.statusCode());
            }
            return new Reply(response.statusCode(), parsed);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new UnreachableException(e);
        } catch (IOException e) {
            throw new UnreachableException(e);
        }
    }
}
