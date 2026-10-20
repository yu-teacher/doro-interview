---
slug: "arc-10"
topic: "design-principles"
tier: DEEP
difficulty: 3
title: "DDD의 애그리거트와 리포지토리는 무엇이고, 애그리거트 경계는 어떤 기준으로 정하나요?"
keywords: ["루트로만 외부 참조", "루트가 불변식 강제", "경계 안 동기·경계 밖 비동기", "필요한 루트에만 리포지토리"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.domainlanguage.com/ddd/reference/"]
concepts: [ddd, tx-boundary]
importance: 2
links: [{to: "arc-05", kind: PREREQ}, {to: "arc-15", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
애그리거트는 엔티티와 값 객체를 묶고 경계를 그어 그 안의 일관성을 지키는 단위입니다. Eric Evans는 루트 엔티티를 하나 정해 외부 객체는 루트만 참조하게 하고, 애그리거트 전체의 불변식을 루트가 강제하게 하라고 합니다. 같은 경계가 트랜잭션과 분산의 단위여서, 경계 안은 일관성 규칙을 동기적으로 적용하고 경계를 넘는 갱신은 비동기로 처리합니다. 리포지토리는 애그리거트 루트들이 메모리 컬렉션인 것처럼 접근하게 해 주는 서비스이고, 직접 접근이 필요한 루트에만 만듭니다. 내부 객체를 따로 조회하면 루트가 규칙을 강제할 수 없게 되기 때문입니다.

```java
class Order {                                   // 애그리거트 루트: 한도 불변식을 루트만 강제
    void add(String item, long price) {
        if (total().won() + price > LIMIT) throw new IllegalStateException("limit exceeded");
        lines.add(new OrderLine(item, new Money(price)));
    }
}
interface OrderRepository { void save(Order o); Optional<Order> findById(long id); }
```

(원저자 자료) Eric Evans, `Domain-Driven Design Reference`(2015-03판 PDF, domainlanguage.com), 쪽 16 Aggregates는 엔티티·값 객체를 애그리거트로 묶고 루트 하나를 정해 외부가 루트만 참조하며, 애그리거트 전체의 불변식 강제를 루트나 지정된 프레임워크 메커니즘이 맡고, 같은 경계가 트랜잭션과 분산을 이끌며, 경계 안은 동기·경계 밖은 비동기로 갱신하라고 한다. 설계가 경계로 잘 안내되지 않으면 모델을 재고하라고도 한다. 쪽 17 Repositories는 애그리거트 루트 타입의 전체 객체를 메모리 컬렉션처럼 보이게 하는 서비스를 만들고, 직접 접근이 필요한 루트에만 제공하며, 제약 없는 쿼리가 애그리거트 내부 객체를 직접 뽑으면 루트가 규칙을 강제하지 못한다고 경고한다.
(원저자 자료) 같은 Reference의 쪽 13 Domain Events는 도메인 전문가가 관심 갖는 일어난 사건을 도메인 객체로 표현하고, 대체로 불변이며 발생 시각과 관련 엔티티의 식별자를 담는다고 설명한다.
(실험 확인) JDK 25 `java Agg.java`에서 6만 원짜리 줄을 담은 주문을 리포지토리에서 다시 읽어 5만 원짜리를 추가하자 루트가 `limit exceeded: 110000`으로 거부했고, 3만 원은 추가되어 합계가 `Money[won=90000]`이었다. 한도 불변식을 루트에 둔 장난감 예의 확인이다.
