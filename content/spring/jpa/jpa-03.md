---
slug: "jpa-03"
topic: "jpa"
tier: BASIC
difficulty: 1
title: "영속성 컨텍스트란 무엇이고 어떤 이점이 있나요?"
keywords: ["1차 캐시", "동일성 보장", "쓰기 지연", "변경 감지", "Session 단명"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.hibernate.org/orm/7.0/introduction/html_single/", "https://docs.hibernate.org/orm/7.0/userguide/html_single/", "https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html"]
---
**모범 답변 (30~60초)**
영속성 컨텍스트는 `EntityManager`(Hibernate에서는 `Session`)가 관리하는 엔티티 인스턴스의 집합으로, 식별자마다 인스턴스가 하나만 있도록 유지합니다. 수명은 보통 트랜잭션과 같고, Session은 단일 스레드에서 짧게 쓰고 버리는 객체입니다. 이점은 네 가지입니다. 첫째, 1차 캐시라서 같은 id를 다시 조회해도 DB에 가지 않습니다. 둘째, 같은 컨텍스트 안에서는 같은 id가 같은 인스턴스라는 동일성이 보장됩니다. 셋째, 쓰기 지연으로 상태 변경을 모아 두었다가 flush 때 SQL로 보냅니다. 넷째, 변경 감지로 값만 바꿔도 flush 때 UPDATE가 나갑니다. Hibernate 문서는 Session이 repeatable read 성격의 1차 캐시를 유지한다고 설명합니다.

(공식 문서) Jakarta Persistence 3.2 사양 7.1절은 영속성 컨텍스트를 "영속 식별자마다 유일한 엔티티 인스턴스가 있는, 관리되는 엔티티 인스턴스의 집합"으로 정의한다. Hibernate 입문서 5.1절은 컨텍스트를 1차 캐시라고도 부르며 식별자에서 인스턴스로의 유일한 매핑을 가지고, 수명은 보통 트랜잭션과 같다고 설명한다. 같은 절은 컨텍스트의 장점으로 데이터 별칭 문제 방지, 자동 변경 감지, 같은 엔티티를 반복 요청할 때의 DB 왕복 절감, 여러 DB 작업을 모아 보내는 일괄 처리를 든다. 또 컨텍스트는 스레드 간 공유나 관련 없는 트랜잭션 간 재사용을 하면 안 되고, 모든 엔티티를 강한 참조로 쥐고 있어 작업 단위가 끝나면 버려야 한다고 설명한다. 사용자 가이드 2.1절은 Session을 단일 스레드의 짧은 수명 객체로 설명하고, 보통 repeatable read인 영속성 컨텍스트(1차 캐시)를 유지한다고 하며, 변경 상태를 큐에 쌓았다가 flush에 동기화하는 방식을 transactional write-behind라 부른다. 3.4.7절은 한 Session 범위 안에서 영속 식별자와 자바 동일성의 일치를 Hibernate가 보장한다고 설명한다.

(실험 확인) 같은 트랜잭션에서 `findById`를 두 번 호출하면 SQL은 한 번이고 두 결과는 같은 인스턴스다. 트랜잭션이 다르면 컨텍스트도 달라 SELECT가 두 번 나가고 서로 다른 인스턴스다.

```java
tx.executeWithoutResult(s -> {
    Member a = memberRepository.findById(id).orElseThrow();
    Member b = memberRepository.findById(id).orElseThrow();
    assertThat(a).isSameAs(b);          // 같은 인스턴스, prepared statement 1회
});
```
