---
slug: "jpa-04"
topic: "jpa"
tier: BASIC
difficulty: 1
title: "1차 캐시와 동일성 보장은 어떻게 동작하고, 한계는 무엇인가요?"
keywords: ["1차 캐시", "트랜잭션 범위", "JPQL은 DB 조회", "2차 캐시와 구분"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.hibernate.org/orm/7.0/introduction/html_single/", "https://docs.hibernate.org/orm/7.0/userguide/html_single/", "https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html"]
---
**모범 답변 (30~60초)**
영속성 컨텍스트는 식별자에서 엔티티 인스턴스로 가는 유일한 매핑을 갖고 있어서, `find`로 조회하면 먼저 그 매핑을 찾고 없을 때만 DB에서 읽어 넣습니다. 그래서 같은 트랜잭션에서 같은 id를 두 번 조회하면 SQL은 한 번이고 `==` 비교도 true입니다. 한계는 범위입니다. 컨텍스트는 보통 트랜잭션 단위로 짧게 살아서 애플리케이션 전체 캐시가 아닙니다. 또 JPQL은 컨텍스트에 이미 있어도 SQL을 DB에 보내고, 결과 행을 컨텍스트의 기존 인스턴스와 맞춰 돌려줄 뿐입니다. 전역 캐시가 필요하면 SessionFactory 단위의 2차 캐시를 따로 검토합니다.

(공식 문서) 입문서 5.1절은 컨텍스트가 식별자와 인스턴스 사이의 유일한 매핑을 쥐고 있고, 수명이 보통 트랜잭션과 같으며 반복 요청 시 DB 왕복을 피하게 해 준다고 설명한다. 사용자 가이드는 한 Session 안에서 같은 행을 여러 번 `find`하면 같은 인스턴스를 돌려준다고 예시하고(3.4.7절), 1차 캐시는 EntityManager가 닫히면 비워지는 단명 캐시인 반면 2차 캐시는 EntityManagerFactory에 묶인다고 구분한다(30.7절). 14장은 Hibernate 캐시가 다른 애플리케이션이 저장소를 바꾼 것을 알지 못한다고 경고한다.

(실험 확인) 같은 트랜잭션의 `findById` 두 번은 SQL이 한 번이고 같은 인스턴스, 서로 다른 트랜잭션에서는 SQL이 두 번이고 다른 인스턴스다. 이미 `findById`로 로딩한 엔티티를 PK 조건 JPQL로 다시 조회해도 SQL은 실행되지만 반환된 인스턴스는 기존 인스턴스와 같다.

```java
Member byId = memberRepository.findById(id).orElseThrow();          // SELECT 1회
Member byJpql = em.createQuery("select m from Member m where m.id = :id", Member.class)
        .setParameter("id", id).getSingleResult();                   // SELECT 또 실행
assertThat(byJpql).isSameAs(byId);                                   // 하지만 같은 인스턴스
```
