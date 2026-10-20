---
slug: "jpa-24"
topic: "jpa"
tier: DEEP
difficulty: 2
title: "JPA와 트랜잭션의 관계, 그리고 `readOnly = true`의 효과는?"
keywords: ["트랜잭션 경계 = 컨텍스트 경계", "readOnly → FlushMode.MANUAL", "더티 체킹 생략", "드라이버 힌트", "자기호출", "데모 실험 5"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
JPA의 영속성 컨텍스트와 flush는 트랜잭션 경계에 묶여 있어서, 쓰기는 `@Transactional` 안에서만 의미 있습니다. **(공식)** Spring Data 문서에 따르면 `CrudRepository`의 읽기 메서드는 readOnly 트랜잭션, 나머지는 기본 `@Transactional`로 돌고, 선언형 쿼리 메서드에는 기본 트랜잭션 설정이 없습니다. readOnly 효과는 JDBC 드라이버에 힌트를 주고, Hibernate에서는 flush 모드를 MANUAL로 바꿔 더티 체킹을 건너뛰어 큰 객체 그래프에서 성능이 좋아집니다. 단 DB가 쓰기를 막아 준다는 보장은 없고 DB에 따라 다릅니다. 데모 `readOnly_트랜잭션에서는_더티체킹이_동작하지_않는다`가 readOnly에서 이름을 바꿔도 DB 값이 "original"로 남음을 검증합니다. 또 `자기호출은_프록시를_거치지_않아...` 테스트처럼 같은 클래스 내부 호출은 프록시를 우회해 트랜잭션이 적용되지 않습니다.
