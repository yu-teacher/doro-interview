package com.doro.interview.account;

import java.time.Instant;
import java.util.UUID;

/**
 * Doro 에서 영구 탈퇴한 사용자가 이 서비스에서 **처음 정리될 때** 한 번 발행되는 이벤트(docs/M2-PLAN.md D11).
 * 같은 트랜잭션 안의 동기 리스너가 듣고 자기 모듈의 사용자 데이터를 지운다(진도·노트는 progress, 시험 기록은 M3 의 quiz).
 * 리스너가 예외를 던지면 무덤 표식까지 롤백되어 다음 동기화 주기에 같은 사용자부터 다시 처리된다.
 */
public record AccountDeleted(UUID userId, Instant deletedAt) {
}
