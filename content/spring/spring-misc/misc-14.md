---
slug: "misc-14"
topic: "spring-misc"
tier: TRICKY
difficulty: 3
title: "동시 중복 가입을 락으로 막을 수는 없나요?"
keywords: ["유니크 인덱스", "synchronized의 한계(다중 인스턴스)", "분산 락", "SERIALIZABLE 부담"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/transaction/annotation/Isolation.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/dao/DataIntegrityViolationException.html"]
concepts: [race-condition, db-locking, schema-design]
importance: 1
links: [{to: "cch-18", kind: RELATED}, {to: "dbl-17", kind: RELATED}, {to: "dbs-01", kind: RELATED}]
---
**모범 답변 (30~60초)**
방법은 있지만 이 경우에는 UNIQUE 제약이 가장 낫습니다. 격리 수준을 SERIALIZABLE로 올리면 팬텀 읽기까지 막지만 동시성이 크게 떨어지고 데드락과 재시도 부담이 생깁니다. 비관적 락은 아직 없는 행을 대상으로 잡기 어려워서 DB와 쿼리 방식에 의존하게 됩니다. 애플리케이션 `synchronized`는 한 JVM 안에서만 유효해서 서버가 여러 대면 무의미하고, 분산 락은 가능하지만 구성이 복잡해집니다. 결국 모든 인스턴스가 공유하는 유일한 지점인 DB 제약을 최종 방어선으로 두고, 위반 시 던져지는 예외를 변환해 응답하는 설계가 단순하고 확실합니다.

(공식 문서) `Isolation.SERIALIZABLE`의 Javadoc은 dirty read, non-repeatable read, 팬텀 읽기가 모두 방지되는 상수이며, 한 트랜잭션이 조건에 맞는 모든 행을 읽은 뒤 다른 트랜잭션이 그 조건에 맞는 행을 삽입하는 상황까지 막는다고 설명한다. `DataIntegrityViolationException` Javadoc은 insert 등이 무결성 제약(유일성 제약 포함)을 어길 때 던져지는 예외라고 한다.

(보충) 나머지 비교는 일반 지식이다. SERIALIZABLE의 성능·데드락 부담, 비관적 락이 없는 행에서 동작하는 방식(DB와 격리 수준에 따라 달라질 수 있다), `synchronized`가 JVM 하나에서만 유효하다는 점, 분산 락의 복잡도는 조사한 스프링 문서에서 확인하지 못했다.

(실험 확인) 이 중 "DB UNIQUE 제약이 최종 방어선"이라는 결론만 실험으로 확인했다. 같은 JVM에서 8개 스레드가 같은 이메일로 동시에 가입을 시도하면 1명만 성공하고 DB에 1행만 남았으며, 실패 7건은 모두 `DataIntegrityViolationException`이었다(MySQL, 유니크 제약이 있는 컬럼, 락 없이 실행; 자세한 구성은 이 주제의 동시성 대표 사례 질문 참고). 락 방식들 자체는 실험하지 않았다.
