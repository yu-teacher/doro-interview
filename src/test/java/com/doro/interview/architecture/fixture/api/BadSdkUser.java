package com.doro.interview.architecture.fixture.api;

import com.hunnit_beasts.doro.sdk.domain.DoroUserContext;

/** 규칙 자체 시험용: account·config 밖에서 Doro SDK 를 쓰는 일부러 만든 위반. 실제 코드가 아니다. */
public class BadSdkUser {
    public Object user() {
        return DoroUserContext.getCurrentUser();
    }
}
