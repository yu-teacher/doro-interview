---
slug: "jpa-01"
topic: "jpa"
tier: BASIC
difficulty: 1
title: "ORM이란 무엇이고, 객체-관계 패러다임 불일치는 무엇인가요?"
keywords: ["ORM", "패러다임 불일치", "상속·연관관계·그래프 탐색·동일성", "JPA는 명세", "Hibernate는 구현체"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.hibernate.org/orm/7.0/userguide/html_single/", "https://docs.hibernate.org/orm/7.0/introduction/html_single/"]
concepts: [orm, entity-mapping]
importance: 3
links: [{to: "jpa-02", kind: FOLLOWUP}, {to: "jpa-03", kind: FOLLOWUP}, {to: "jpa-32", kind: RELATED}]
---
**모범 답변 (30~60초)**
ORM은 객체 모델과 관계형 테이블 사이의 매핑을 맡아, 개발자가 SQL과 결과 집합 변환 코드를 직접 쓰지 않고 객체를 다루듯 데이터를 저장하고 조회하게 해 주는 기술입니다. Hibernate 문서는 객체와 관계형 DB의 데이터 표현 방식이 달라 생기는 패러다임 불일치가 개발 비용을 크게 높인다고 설명합니다. 불일치는 네 곳에서 드러납니다. 상속 계층은 테이블로 옮길 전략을 골라야 하고, 연관은 객체의 참조가 DB에서는 외래 키로 저장되며, 객체 그래프는 통째로 읽을 수 없어 어디서 끊을지 정해야 하고, 같은 행이 여러 객체로 만들어질 수 있어 동일성이 어긋납니다. JPA는 이 매핑의 표준 명세이고 Hibernate가 구현체이며, 영속성 컨텍스트가 한 세션 안에서는 같은 행을 같은 인스턴스로 맞춰 줍니다. 대신 N+1 같은 성능 문제는 개발자가 관리해야 합니다.

(공식 문서) 사용자 가이드 서문은 객체와 관계형 DB 사이의 패러다임 불일치가 개발 비용을 크게 높인다고 설명하고, 입문서 1장은 ORM이 객체 그래프를 테이블 행으로 펼치고 조회 결과로 그래프를 다시 만드는 반복적이고 깨지기 쉬운 코드를 덜어 준다고 설명한다. 입문서 3.16절(연관)은 연관이 보통 한쪽 테이블의 외래 키로 매핑되고, 자바에서는 단방향·양방향 탐색을 따로 정하며 DB에 반영하려면 소유 측을 바꿔야 한다고 설명한다. 4.1절은 상속 계층을 SINGLE_TABLE, JOINED, TABLE_PER_CLASS 같은 전략 중 하나로 매핑한다고 설명한다. 5.6절은 연관된 엔티티를 재귀적으로 모두 읽을 수는 없어 프록시와 지연 로딩으로 그래프를 끊는다고 설명한다. 사용자 가이드(equals/hashCode 절)는 같은 행에 해당하는 인스턴스가 여럿이 될 수 있는 문제를 짚고, 한 Session 범위 안에서는 DB 행과 자바 동일성이 일치하도록 Hibernate가 보장한다고 설명한다. 입문서 1.1절은 Hibernate가 JPA 명세의 구현을 포함한다고 밝힌다. N+1은 입문서 8.4절이 데이터 접근 성능 저하의 가장 흔한 원인으로 다룬다.

```java
// 객체 세계: member.getPosts() 로 탐색
// 테이블 세계: post.member_id (FK) 하나뿐, 반대 방향은 JOIN
```
