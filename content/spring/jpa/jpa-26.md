---
slug: "jpa-26"
topic: "jpa"
tier: TRICKY
difficulty: 3
title: "변경 감지가 있는데 왜 굳이 `@Transactional(readOnly = true)`를 서비스에 걸나요?"
keywords: ["스냅샷 비용 절감", "실수 방지", "바깥 트랜잭션 우선", "DB 강제 아님"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.hibernate.org/orm/7.0/introduction/html_single/", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/transaction/annotation/Transactional.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/orm/jpa/JpaDialect.html", "https://docs.spring.io/spring-data/jpa/reference/jpa/transactions.html"]
concepts: [declarative-tx, dirty-checking]
importance: 2
links: [{to: "jpa-06", kind: PREREQ}, {to: "jpa-24", kind: PREREQ}, {to: "tx-13", kind: RELATED}]
---
**모범 답변 (30~60초)**
조회 전용 메서드에서 더티 체킹 비용을 줄이고, 실수로 엔티티를 바꿔도 UPDATE가 나가지 않게 하려는 것입니다. Hibernate는 엔티티를 읽은 뒤 스냅샷을 보관했다가 flush 때 현재 상태와 비교해 변경을 찾는데, 공식 문서는 이 스냅샷 유지가 성능에 영향을 주고 flush가 모든 엔티티를 더티 체크하는 비싼 작업이라고 설명합니다. Spring은 readOnly 플래그를 flush 모드에 반영할 수 있고, Hibernate에서는 MANUAL(자동 flush 안 함)이 되어 변경이 UPDATE로 나가지 않는 것으로 알려져 있습니다(보충). 다만 이는 DB가 쓰기를 거부한다는 뜻이 아니고, 메서드 안의 명시적 `flush()`는 동작이 달라질 수 있습니다(보충). 쓰기 서비스가 부르는 하위 조회는 바깥 트랜잭션 설정이 우선합니다.

(공식 문서) Hibernate 입문서 9.12절은 바이트코드 강화가 없으면 Hibernate가 각 엔티티의 스냅샷을 보관하고 flush 때 현재 상태와 비교하며 스냅샷 유지가 성능에 영향을 준다고 한다. 5.9절은 flush 때 영속성 컨텍스트의 모든 엔티티를 더티 체크하므로 flush가 비싼 작업이고, MANUAL은 자동으로 flush하지 않는 모드라고 한다. `@Transactional.readOnly` Javadoc은 실제 트랜잭션 시스템에 대한 최적화 힌트일 뿐 쓰기 시도를 반드시 실패시키지는 않는다고 한다. `JpaDialect` Javadoc은 구현이 readOnly 플래그를 flush 모드로 적용할 수 있다고 한다. Spring Data JPA 트랜잭션 문서는 서비스 같은 상위 계층의 트랜잭션이 있으면 리포지토리 쪽 트랜잭션 설정은 무시되고 바깥 트랜잭션 설정이 실제 설정을 결정한다고 설명한다.
(보충) Spring의 Hibernate 방언이 readOnly일 때 flush 모드를 MANUAL로 바꾼다는 것, 그리고 그 상태에서 명시적 `flush()`를 부르면 변경이 반영될 수 있다는 점은 이번에 문서로 직접 확인하지 못했다. 

(실험 확인) `@Transactional(readOnly = true)` 메서드에서 조회한 엔티티의 이름을 바꾸고 끝내면, 별도 조회에서 DB 값은 원래 값 그대로다.
