---
slug: "jpa-07"
topic: "jpa"
tier: BASIC
difficulty: 1
title: "엔티티의 생명주기 상태 네 가지를 설명해 주세요."
keywords: ["transient", "managed", "detached", "removed", "persist/merge/detach/remove"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
비영속(transient)은 `new`로 만들기만 하고 컨텍스트와 무관한 상태입니다. 영속(managed)은 컨텍스트가 관리하는 상태로 `persist`나 조회로 됩니다. 준영속(detached)은 한때 관리됐지만 컨텍스트가 닫히거나 `detach`/`clear`로 분리된 상태로, 변경 감지가 안 됩니다. 삭제(removed)는 `remove`로 삭제가 예약된 상태이고 flush 때 DELETE가 나갑니다. 트랜잭션이 끝나면 조회했던 엔티티는 준영속이 되고, 이때 지연 로딩이 막힙니다. **(공식)** Hibernate 문서는 엔티티가 managed, transient, detached가 될 수 있고, 동일성 보장은 하나의 Session 안에서만 성립한다고 설명합니다.
