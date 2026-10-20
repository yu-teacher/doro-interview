package com.doro.interview.architecture.fixture.catalog;

import com.doro.interview.architecture.fixture.quiz.QuizThing;

/** 규칙 자체 시험용: catalog 가 quiz 에 의존하는 일부러 만든 위반. 실제 코드가 아니다. */
public class BadCatalog {
    private final QuizThing thing = new QuizThing();

    public QuizThing thing() {
        return thing;
    }
}
