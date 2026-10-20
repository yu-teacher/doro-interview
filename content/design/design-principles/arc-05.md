---
slug: "arc-05"
topic: "design-principles"
tier: BASIC
difficulty: 2
title: "DDD에서 엔티티와 값 객체는 어떻게 다르고, 어떻게 구분하나요?"
keywords: ["속성이 아닌 정체성으로 구분", "값 객체는 정체성 없음", "불변과 부작용 없는 연산", "무엇이 같은지 모델이 정의"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.domainlanguage.com/ddd/reference/"]
concepts: [ddd, equals-hashcode, immutability]
importance: 2
links: [{to: "arc-10", kind: FOLLOWUP}, {to: "jpa-33", kind: RELATED}, {to: "jpa-21", kind: RELATED}]
refs: ["Evans, Domain-Driven Design Reference: Definitions and Pattern Summaries (2015, CC BY 4.0), Entities, p.11"]
---
**모범 답변 (30~60초)**
엔티티는 속성이 아니라 정체성으로 구분되는 객체입니다. 속성이 바뀌어도 같은 대상이고 속성이 같아도 다른 대상일 수 있어서, 무엇이 같은 것인지를 모델이 정의해야 한다고 Eric Evans는 설명합니다. 값 객체는 속성과 그에 딸린 로직에만 관심 있는 요소로 개념적 정체성이 없고, 불변으로 다루며 연산은 부작용이 없게 만들라고 합니다. 예컨대 회원은 이름을 바꿔도 같은 회원이므로 엔티티이고, 금액은 값이 같으면 같은 것이므로 값 객체로 모델링합니다. 정체성을 추적하는 일은 비용이 크기 때문에 필요한 곳에만 붙이자는 취지입니다.

```java
record Money(long won, String cur) {}          // 값 객체: 속성이 같으면 같다
// 엔티티: equals/hashCode 를 id 기준으로 정의
public boolean equals(Object o) { return o instanceof Member m && m.id == id; }
```

(원저자 자료) Eric Evans, `Domain-Driven Design Reference`(2015-03판 PDF, domainlanguage.com), 쪽 11 Entities는 속성이 아닌 정체성으로 구분되는 객체의 정체성을 모델 정의의 중심에 두고, 형태나 이력과 무관하게 각 객체를 구별하는 수단을 정의하라고 한다. 쪽 12 Value Objects는 속성과 로직만 관심 있을 때 값 객체로 분류하고, 불변으로 다루며 모든 연산을 부작용 없는 함수로 만들고, 정체성을 주지 말라고 하며, 정체성 부여가 성능을 해치고 분석 작업을 늘릴 수 있다고 한다.
(실험 확인) JDK 25 `java Ev.java`에서 `record Money`는 속성이 같으면 `equals`가 true였고, id 기준으로 `equals`를 정의한 `Member`는 이름이 달라도 id가 같으면 true, id가 다르면 false였다.
(보충) 회원·금액 예와 Java `record`를 값 객체에 쓰는 방식은 설명을 위한 예시이며 Reference 본문의 예가 아니다.
