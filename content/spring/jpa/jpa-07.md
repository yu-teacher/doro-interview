---
slug: "jpa-07"
topic: "jpa"
tier: BASIC
difficulty: 1
title: "엔티티의 생명주기 상태 네 가지를 설명해 주세요."
keywords: ["transient", "managed", "detached", "removed", "persist/merge/detach/remove"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.hibernate.org/orm/7.0/userguide/html_single/", "https://docs.hibernate.org/orm/7.0/introduction/html_single/", "https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html"]
concepts: [persistence-context]
importance: 2
links: [{to: "jpa-03", kind: PREREQ}, {to: "jpa-08", kind: FOLLOWUP}, {to: "jpa-19", kind: RELATED}]
---
**모범 답변 (30~60초)**
엔티티 인스턴스는 비영속, 영속, 준영속, 삭제 네 상태 중 하나입니다. 비영속(Hibernate 용어로 transient, 사양 용어로 new)은 `new`로 만들기만 해서 영속성 컨텍스트와 무관한 상태입니다. 영속(managed)은 컨텍스트가 관리하는 상태로 `persist`나 조회로 됩니다. 준영속(detached)은 식별자는 있지만 컨텍스트와 더는 연결되지 않은 상태로, `detach`·`clear`·컨텍스트 종료로 되며 변경이 DB와 동기화되지 않습니다. 삭제(removed)는 `remove`로 삭제가 예약된 상태이고 커밋이나 flush 때 DELETE가 나갑니다. 트랜잭션 범위 컨텍스트는 커밋 때 관리하던 엔티티가 준영속이 되고, 준영속 프록시를 초기화하면 지연 로딩 예외가 납니다.

(공식 문서) Jakarta Persistence 3.2 사양 3.3절은 엔티티 인스턴스가 new, managed, detached, removed 중 하나라고 정의한다. new는 영속 식별자가 없고 컨텍스트와 연결되지 않은 상태, managed는 식별자가 있고 컨텍스트에 연결된 상태, detached는 식별자는 있지만 연결이 없거나 끊긴 상태, removed는 컨텍스트에 연결되어 있으며 커밋 때 DB에서 삭제될 상태다. 3.3.3절은 삭제가 커밋 시점 또는 flush의 결과로 DB에서 일어난다고 한다. 3.3.6절은 `detach`가 엔티티를 컨텍스트에서 분리하고 이후 변경이 동기화되지 않는다고 하며, `clear`는 관리 중인 엔티티를 모두 준영속으로 만든다(`EntityManager.clear` 문서). 3.4.2절은 트랜잭션 범위 컨텍스트의 관리 엔티티가 커밋 시 준영속이 된다고 한다. Hibernate 사용자 가이드 6장은 같은 네 상태를 transient, managed(persistent), detached, removed로 설명하고, 한 Session 범위 안에서만 동일성이 보장된다고 설명한다(3.4.7절). 입문서 5.6절은 세션이 끝나 컨텍스트가 정리되면 프록시를 더 가져올 수 없고 메서드 호출 시 `LazyInitializationException`이 난다고 한다.
