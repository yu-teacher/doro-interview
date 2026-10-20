package com.doro.interview.architecture.fixture.quiz;

import com.doro.interview.architecture.fixture.progress.WriteThing;

/** 규칙 자체 시험용 위반: quiz 가 progress 의 read 밖 클래스를 쓴다. */
public class BadQuiz {
    WriteThing write = new WriteThing();
}
