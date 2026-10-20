package com.doro.interview.architecture.fixture.progress;

import com.doro.interview.architecture.fixture.mine.MineWrite;

/** 규칙 자체 시험용 위반: progress 가 mine 의 읽기 창구 밖을 쓴다. */
public class BadProgress {
    MineWrite write = new MineWrite();
}
