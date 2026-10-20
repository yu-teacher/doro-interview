package com.doro.interview.quiz.ai;

/** AI 피드백 공급자. 구현은 호출이 실패하면 {@link FeedbackUnavailableException} 만 던진다(시험은 계속된다). */
public interface FeedbackProvider {

    /** 질문, 비교할 모범 답변, 내 답. 모두 일반 텍스트다. */
    record Request(String title, String reference, String answer) {
    }

    /** 이 공급자가 지금 쓸 수 있는가(꺼짐·키 없음이면 false). */
    boolean available();

    /** 사용한 모델 이름(저장용). */
    String model();

    /** 피드백 평문. 실패하면 {@link FeedbackUnavailableException}. */
    String feedback(Request request) throws FeedbackUnavailableException;
}
