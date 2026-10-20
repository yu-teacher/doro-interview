package com.doro.interview.architecture.fixture.common;

import com.doro.interview.architecture.fixture.catalog.BadCatalog;

/** 규칙 자체 시험용: common 이 catalog 에 의존하는 일부러 만든 위반. 실제 코드가 아니다. */
public class BadCommon {
    public BadCatalog catalog() {
        return new BadCatalog();
    }
}
