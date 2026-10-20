---
slug: "jpa-34"
topic: "jpa"
tier: DEEP
difficulty: 2
title: "enum을 매핑할 때 @Enumerated 기본값이 왜 문제인가요?"
keywords: ["@Enumerated", "EnumType.STRING", "ORDINAL", "선언 순서", "@EnumeratedValue"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.hibernate.org/orm/7.0/introduction/html_single/", "https://docs.hibernate.org/orm/7.0/userguide/html_single/", "https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html"]
concepts: [entity-mapping]
importance: 2
links: [{to: "jpa-33", kind: RELATED}, {to: "jo-05", kind: RELATED}]
---
**모범 답변 (30~60초)**
@Enumerated를 붙이지 않으면 기본은 ORDINAL, 즉 선언 순서 정수 저장입니다(사양상 `@EnumeratedValue`가 없을 때). Hibernate 입문 가이드는 JPA가 기본값을 잘못 골랐다고 표현하며, 정수 인코딩은 관계형 데이터를 해석하기 어렵게 만든다는 이유로 대부분의 enum 속성에 EnumType.STRING을 권합니다. STRING은 상수 이름을 저장합니다. (보충) 또 ORDINAL은 중간에 상수를 끼워 넣거나 순서를 바꾸면 기존 데이터의 의미가 어긋날 수 있는데, 이는 문서의 직접 설명이 아니라 제 추론입니다. 이름이 아니라 별도 코드값으로 저장하고 싶으면 Hibernate 7 계열 가이드에 소개된 @EnumeratedValue나 AttributeConverter를 쓸 수 있는데, 컨버터는 @Enumerated와 같은 속성에 함께 쓸 수 없습니다.

```java
@Enumerated(EnumType.STRING)
private OrderStatus status;
```

(공식 문서) 입문 가이드 3.11이 기본값 ORDINAL·STRING 권장·@EnumeratedValue를 설명하고, Jakarta Persistence 3.2 사양 11.1.18이 `@Enumerated`의 기본 ORDINAL과, 명시가 없고 컨버터도 없을 때 String 타입 `@EnumeratedValue` 필드가 있으면 STRING으로 추론하는 규칙을 적는다(그 외는 ORDINAL). 사용자 가이드 3.2.5가 ORDINAL/STRING 정의와 컨버터 제약을 설명한다. (보충) 순서 변경 시 데이터 의미가 어긋난다는 설명은 문서 문장이 아니라 ORDINAL 정의로부터의 추론이다. @EnumeratedValue는 7.0 문서 기준이라 버전 의존이다.
