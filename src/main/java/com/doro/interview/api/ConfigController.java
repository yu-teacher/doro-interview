package com.doro.interview.api;

import com.doro.interview.common.response.ApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.regex.Pattern;

/**
 * 웹이 시작할 때 읽는 공개 설정(로그인 필요 없음, 공용 캐시 대상, 사용자 상태 없음). 지금은 방문 통계(구글 애널리틱스 4)의 측정 ID 뿐이다.
 * 측정 ID 는 비밀이 아니다(페이지 소스에 그대로 노출된다). 빌드에 박지 않고 서버 환경변수({@code INTERVIEW_GA_ID})로 받아, 바꿀 때 다시 빌드하지 않는다.
 * 형식이 맞지 않는 값은 없는 것으로 본다(잘못된 값이 스크립트 주소에 섞이지 않게).
 */
@RestController
@RequestMapping("/api/v1")
public class ConfigController {

    private static final Pattern GA4_ID = Pattern.compile("G-[A-Z0-9]{4,20}");

    private final String analyticsId;

    public ConfigController(@Value("${interview.analytics.ga-measurement-id:}") String configured) {
        String id = configured == null ? "" : configured.strip();
        this.analyticsId = GA4_ID.matcher(id).matches() ? id : null;
    }

    public record ConfigResponse(String analyticsId) {
    }

    @GetMapping("/config")
    public ApiResponse<ConfigResponse> config() {
        return ApiResponse.cacheable(new ConfigResponse(analyticsId));
    }
}
