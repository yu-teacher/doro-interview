package com.doro.interview.api;

import com.doro.interview.account.CurrentUser;
import com.doro.interview.common.exception.ErrorCode;
import com.doro.interview.common.exception.InterviewException;
import com.doro.interview.common.response.ApiResponse;
import com.doro.interview.reminder.PushSettings;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

/**
 * 복습 알림 설정(이 기기). 전부 로그인이 필요하다. 게이트웨이가 GET·PUT 만 통과시키므로 끄기도 PUT 이다.
 * 실제 기기 등록·발송은 플랫폼 알림 서비스가 하고, 이 서비스는 사용자 대신 그 API 를 부른다.
 */
@RestController
@RequestMapping("/api/v1/me/push")
public class PushController {

    /** 브라우저가 만든 구독. keys 는 웹 푸시 암호화 키(RFC 8291). */
    public record SubscriptionRequest(String endpoint, Keys keys) {
        public record Keys(String p256dh, String auth) {
        }
    }

    public record EndpointRequest(String endpoint) {
    }

    private static final int MAX_ENDPOINT = 2048;
    private static final int MAX_KEY = 256;

    private final CurrentUser currentUser;
    private final PushSettings push;

    public PushController(CurrentUser currentUser, PushSettings push) {
        this.currentUser = currentUser;
        this.push = push;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PushSettings.Config>> config() {
        currentUser.require();
        return noStore(push.config());
    }

    @PutMapping("/subscription")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> subscribe(@RequestBody SubscriptionRequest request, HttpServletRequest http) {
        UUID user = currentUser.require();
        if (request == null || !validEndpoint(request.endpoint()) || request.keys() == null
                || !validKey(request.keys().p256dh()) || !validKey(request.keys().auth())) {
            throw new InterviewException(ErrorCode.INVALID_INPUT);
        }
        push.subscribe(user, request.endpoint(), request.keys().p256dh(), request.keys().auth(), http.getHeader(HttpHeaders.USER_AGENT));
        return noStore(Map.of("subscribed", true));
    }

    @PutMapping("/unsubscribe")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> unsubscribe(@RequestBody EndpointRequest request) {
        UUID user = currentUser.require();
        if (request == null || !validEndpoint(request.endpoint())) {
            throw new InterviewException(ErrorCode.INVALID_INPUT);
        }
        push.unsubscribe(user, request.endpoint());
        return noStore(Map.of("subscribed", false));
    }

    @PutMapping("/test")
    public ResponseEntity<ApiResponse<PushSettings.TestResult>> test() {
        return noStore(push.test(currentUser.require()));
    }

    /** 구독 주소는 https 여야 한다. 허용 호스트(푸시 서비스) 검사는 알림 서비스가 한다. */
    private static boolean validEndpoint(String endpoint) {
        return endpoint != null && endpoint.length() <= MAX_ENDPOINT && endpoint.strip().startsWith("https://");
    }

    private static boolean validKey(String key) {
        return key != null && !key.isBlank() && key.length() <= MAX_KEY && key.matches("[A-Za-z0-9_=-]+");
    }

    private static <T> ResponseEntity<ApiResponse<T>> noStore(T data) {
        return ResponseEntity.ok().header(HttpHeaders.CACHE_CONTROL, "no-store").body(ApiResponse.success(data));
    }
}
