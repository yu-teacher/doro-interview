package com.doro.interview.quiz.ai;

/** 공급자 호출이 실패했다(네트워크·시간 초과·오류 응답·깨진 응답). 원인 메시지에는 키나 사용자 글을 넣지 않는다. */
public class FeedbackUnavailableException extends Exception {

    public FeedbackUnavailableException(String message) {
        super(message);
    }

    public FeedbackUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
