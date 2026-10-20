package com.doro.interview.account;

import java.util.Optional;
import java.util.UUID;

/**
 * 지금 요청을 보낸 사람(Doro 사용자 id). 다른 모듈은 Doro SDK 를 모르고 이 인터페이스만 쓴다(docs/M2-PLAN.md D4).
 * 사용자 id 는 **토큰에서만** 얻는다: 요청 경로·쿼리·본문으로 받은 id 를 믿는 코드가 없어서 남의 데이터에는 닿을 방법이 없다.
 */
public interface CurrentUser {

    /**
     * 로그인했고 탈퇴하지 않았으면 그 id. 읽기 전용이다(사용자 행을 만들지 않는다).
     * 잘못된·만료된 토큰, 탈퇴한 사용자는 익명과 같다(빈 값).
     */
    Optional<UUID> id();

    /** {@link #id()} 와 같되, 이 서비스에 사용자 행이 없으면 만든다(로그인 뒤 첫 확인). 탈퇴한 사용자는 만들지도 되살리지도 않는다. */
    Optional<UUID> activate();

    /** 쓰기 요청용: {@link #activate()} 하고 없으면 401. */
    UUID require();
}
