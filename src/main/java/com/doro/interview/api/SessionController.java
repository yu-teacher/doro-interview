package com.doro.interview.api;

import com.doro.interview.account.CurrentUser;
import com.doro.interview.common.response.ApiResponse;
import com.fasterxml.jackson.annotation.JsonInclude;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * 현재 로그인 상태. 로그인·콜백·로그아웃은 게이트웨이 뒤의 BFF(doro-bff)가 맡고, 이 서비스는 이 조회만 제공한다(docs/M2-PLAN.md D1).
 * 비로그인·잘못된 토큰·탈퇴한 사용자도 **200**(`authenticated=false`)이라 화면이 401 처리 없이 상태를 알 수 있다.
 * 로그인 뒤 첫 조회에서 이 서비스의 사용자 행이 한 번만 만들어진다. 이메일·역할·세션 id 는 화면에 필요 없어서 싣지 않는다.
 */
@RestController
@RequestMapping("/api/v1/bff")
public class SessionController {

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record SessionResponse(boolean authenticated, SessionUser user) {
    }

    public record SessionUser(UUID userId) {
    }

    private final CurrentUser currentUser;

    public SessionController(CurrentUser currentUser) {
        this.currentUser = currentUser;
    }

    @GetMapping("/session")
    public ResponseEntity<ApiResponse<SessionResponse>> session() {
        SessionResponse body = currentUser.activate()
                .map(id -> new SessionResponse(true, new SessionUser(id)))
                .orElse(new SessionResponse(false, null));
        // 사용자마다 다르고 로그인·로그아웃으로 바뀌므로 어디에도 저장하지 않는다
        return ResponseEntity.ok().header(HttpHeaders.CACHE_CONTROL, "no-store").body(ApiResponse.success(body));
    }
}
