---
slug: "jpa-10"
topic: "jpa"
tier: DEEP
difficulty: 2
title: "IDENTITY와 SEQUENCE 전략은 INSERT 시점이 어떻게 다른가요?"
keywords: ["IDENTITY는 persist 즉시 INSERT", "SEQUENCE는 flush 때 INSERT", "allocationSize", "배치 insert"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
**(공식)** IDENTITY는 DB의 auto-increment 컬럼을, SEQUENCE는 DB 시퀀스를 씁니다. IDENTITY는 id를 INSERT를 해봐야 알 수 있기 때문에, `persist` 시점에 바로 INSERT가 실행됩니다. 즉 쓰기 지연이 깨집니다. 데모의 `Member`와 `Post`가 IDENTITY를 씁니다. SEQUENCE는 시퀀스에서 id를 먼저 받아 컨텍스트에 올리고 INSERT는 flush 때 보내므로 쓰기 지연과 JDBC 배치가 가능합니다. **(공식)** SEQUENCE는 `allocationSize`만큼 id 블록을 한 번에 확보해서 시퀀스 호출을 줄이고, 그 대신 id가 연속적이지 않을 수 있습니다. IDENTITY에서 배치 INSERT가 사실상 어렵다는 점은 일반적으로 알려진 사실입니다(보충, 이번에 문서에서 직접 확인하지는 못함).

- (실험 확인) IDENTITY의 INSERT는 `persist` 시점에 실행되지만 커밋 전이라 다른 커넥션에서는 보이지 않는다. 주의: `TransactionTemplate` 안에서 `JdbcTemplate`을 쓰면 같은 커넥션을 공유해 커밋 전 행도 보이므로, 다른 커넥션 관점은 `REQUIRES_NEW`로 확인해야 한다. 확인 테스트: `experiment/jpa/PersistenceContextExperimentTest`.
