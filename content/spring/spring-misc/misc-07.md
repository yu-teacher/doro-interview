---
slug: "misc-07"
topic: "spring-misc"
tier: DEEP
difficulty: 2
title: "Hikari 커넥션 풀 크기와 톰캣 스레드 수의 관계는 왜 중요한가요?"
keywords: ["HikariCP", "maximum-pool-size", "connectionTimeout", "커넥션 고갈", "트랜잭션 범위 최소화", "스레드 풀 vs 커넥션 풀"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
톰캣 워커 스레드는 기본 200개 정도인데, HikariCP의 기본 `maximum-pool-size`는 10개입니다. 동시 요청이 100개 들어와도 DB 커넥션은 10개뿐이라 나머지 90개 스레드는 커넥션을 얻으려고 대기하고, `connectionTimeout`(기본 30초)을 넘기면 예외가 납니다. 특히 `@Transactional` 메서드 안에서 외부 API 호출처럼 오래 걸리는 작업을 하면 커넥션을 오래 점유해서 풀이 금방 고갈됩니다. 그래서 트랜잭션은 짧게 유지하고 외부 호출은 트랜잭션 밖으로 빼며, 풀 크기는 "크게"가 아니라 DB가 감당할 수 있는 동시성에 맞춰 측정으로 정합니다. 데모의 `application-prod.yml`도 `maximum-pool-size: 10`을 명시하고 있습니다.

(보충) 톰캣 기본 200 스레드, Hikari 기본 10과 30초 타임아웃은 필자가 알고 있는 기본값이며 이번 조사에서 공식 문서로 직접 확인하지 못했다 (Boot 버전별로 확인 필요).
(공식) Boot 레퍼런스에는 가상 스레드 활성화 시 스레드 풀 관련 설정이 더 이상 효과가 없다고 적혀 있다.
