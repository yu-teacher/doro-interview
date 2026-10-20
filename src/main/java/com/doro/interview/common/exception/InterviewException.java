package com.doro.interview.common.exception;

public class InterviewException extends RuntimeException {

    private final ErrorCode errorCode;

    public InterviewException(ErrorCode errorCode) {
        super(errorCode.message());
        this.errorCode = errorCode;
    }

    public InterviewException(ErrorCode errorCode, String detailMessage) {
        super(detailMessage);
        this.errorCode = errorCode;
    }

    public ErrorCode errorCode() {
        return errorCode;
    }
}
