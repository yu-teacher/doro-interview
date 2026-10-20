package com.doro.interview.quiz.ai;

/** 꺼져 있거나 키가 없을 때의 공급자: 아무 일도 하지 않는다. */
final class DisabledFeedbackProvider implements FeedbackProvider {

    @Override
    public boolean available() {
        return false;
    }

    @Override
    public String model() {
        return "disabled";
    }

    @Override
    public String feedback(Request request) throws FeedbackUnavailableException {
        throw new FeedbackUnavailableException("AI 피드백이 꺼져 있다");
    }
}
