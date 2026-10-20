package com.doro.interview.common.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    // 400 Bad Request
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "COMMON-400-01", "잘못된 입력값입니다."),
    INVALID_SEARCH_QUERY(HttpStatus.BAD_REQUEST, "SEARCH-400-01", "검색어가 올바르지 않습니다."),

    // 401 Unauthorized
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "AUTH-401-01", "로그인이 필요합니다."),

    // 404 Not Found: 비공개 주제·닫힌 질문·없는 주소는 모두 같은 응답이다(존재 여부를 드러내지 않는다)
    NOT_FOUND(HttpStatus.NOT_FOUND, "COMMON-404-01", "요청한 리소스를 찾을 수 없습니다."),

    // 405
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "COMMON-405-01", "지원하지 않는 HTTP 메서드입니다."),

    // 406
    NOT_ACCEPTABLE(HttpStatus.NOT_ACCEPTABLE, "COMMON-406-01", "요청한 응답 형식을 제공할 수 없습니다."),

    // 500 Internal Server Error
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "SYS-500-01", "서버 내부 오류가 발생했습니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;

    ErrorCode(HttpStatus httpStatus, String code, String message) {
        this.httpStatus = httpStatus;
        this.code = code;
        this.message = message;
    }

    public HttpStatus httpStatus() {
        return httpStatus;
    }

    public String code() {
        return code;
    }

    public String message() {
        return message;
    }
}
