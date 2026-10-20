---
slug: "jpa-26"
topic: "jpa"
tier: TRICKY
difficulty: 3
title: "변경 감지가 있는데 왜 굳이 `@Transactional(readOnly = true)`를 서비스에 걸나요?"
keywords: ["스냅샷 비용 절감", "실수 방지", "바깥 트랜잭션 우선", "DB 강제 아님"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
조회 전용 메서드에서 스냅샷 비교 비용을 줄이고, 실수로 엔티티를 바꿔도 UPDATE가 나가지 않게 하기 위해서입니다. **(공식)** Hibernate는 readOnly 트랜잭션에서 flush 모드가 MANUAL이 되어 더티 체킹을 건너뜁니다. 다만 안전장치일 뿐 DB가 쓰기를 거부하는 것은 아니라는 점, 그리고 메서드 안에서 명시적으로 `flush()`를 부르면 동작이 달라질 수 있다는 점은 짚어 둡니다(보충). 쓰기 서비스에서 호출하는 하위 조회는 바깥 트랜잭션이 우선합니다. **(공식)** 문서도 상위 서비스 트랜잭션이 리포지토리의 설정보다 우선한다고 설명합니다.
