package com.doro.interview.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import org.springframework.http.HttpStatus;

import java.time.Instant;

/**
 * 워크스페이스 표준 응답 규격(doro-games 와 같다). 성공은 {@code success=true, data}, 실패는 {@code code/message/status} 최상위 필드.
 * {@code error} 중첩 객체는 이전 클라이언트와의 호환을 위해 같은 내용을 한 번 더 내려준다.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(boolean success, T data, String code, String message, Integer status, ErrorDetail error, Instant timestamp) {

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, data, null, null, null, null, Instant.now());
    }

    public static ApiResponse<Void> ok() {
        return new ApiResponse<>(true, null, null, null, null, null, Instant.now());
    }

    public static ApiResponse<Void> error(HttpStatus status, String code, String message) {
        return new ApiResponse<>(false, null, code, message, status.value(), new ErrorDetail(code, message), Instant.now());
    }

    public record ErrorDetail(String code, String message) {
    }
}
