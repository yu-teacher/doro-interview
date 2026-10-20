---
slug: "misc-14"
topic: "spring-misc"
tier: TRICKY
difficulty: 3
title: "동시 중복 가입을 락으로 막을 수는 없나요?"
keywords: ["유니크 인덱스", "synchronized의 한계(다중 인스턴스)", "분산 락", "SERIALIZABLE 부담"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
방법은 있지만 이 경우 UNIQUE 제약이 가장 낫습니다. 비관적 락은 "없는 행"에는 걸 대상이 없어서 쓰기 어렵고, 격리 수준을 SERIALIZABLE로 올리면 성능과 데드락 부담이 큽니다. 애플리케이션 `synchronized`는 서버가 한 대일 때만 유효하고 여러 인스턴스에서는 무의미합니다. 분산 락도 가능하지만 복잡도가 커집니다. 결국 모든 인스턴스가 공유하는 유일한 지점인 DB 제약을 최종 방어선으로 두고, 예외를 변환해 응답하는 설계가 단순하고 확실합니다.

(보충) 전체가 필자의 일반 지식이다.
