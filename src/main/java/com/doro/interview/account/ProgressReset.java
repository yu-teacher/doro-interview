package com.doro.interview.account;

import java.util.UUID;

/**
 * 사용자가 "내 현황 초기화"를 눌렀을 때 발행되는 이벤트. 같은 트랜잭션 안의 동기 리스너가 듣고 자기 모듈의 **학습 현황**(학습 체크, 시험 기록·통계)을 지운다.
 * 노트와 내 질문은 사용자가 직접 쓴 내용이라 지우지 않는다. 리스너가 예외를 던지면 전체가 롤백되어 일부만 지워진 상태가 남지 않는다.
 */
public record ProgressReset(UUID userId) {
}
