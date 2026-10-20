---
slug: "jpa-34"
topic: "jpa"
tier: DEEP
difficulty: 2
title: "enum을 매핑할 때 @Enumerated 기본값이 왜 문제인가요?"
keywords: ["@Enumerated", "EnumType.STRING", "ORDINAL", "선언 순서", "@EnumeratedValue"]
has_extra: true
status: DRAFT
sources: ["https://docs.hibernate.org/orm/7.0/introduction/html_single/", "https://docs.hibernate.org/orm/7.0/userguide/html_single/"]
---
**모범 답변 (30~60초)**
@Enumerated를 붙이지 않으면 JPA는 enum을 ORDINAL, 즉 선언 순서 정수로 저장합니다. Hibernate 입문 가이드는 이 기본값이 잘못된 선택이라고까지 표현하며 대부분의 enum 속성에는 EnumType.STRING을 권합니다. STRING은 상수 이름을 저장하고, ORDINAL은 중간에 상수를 끼워 넣거나 순서를 바꾸는 순간 기존 데이터의 의미가 어긋날 수 있어 위험합니다. 이 위험은 문서의 직접 설명이 아니라 제 추론이라 보충으로 말씀드립니다. 이름이 아니라 별도 코드값으로 저장하고 싶으면 Hibernate 7 계열 가이드에 소개된 @EnumeratedValue나 AttributeConverter를 쓸 수 있는데, 컨버터는 @Enumerated와 같은 속성에 함께 쓸 수 없습니다.

```java
@Enumerated(EnumType.STRING)
private OrderStatus status;
```

(공식 문서) 입문 가이드 3.11이 기본값 ORDINAL·STRING 권장·@EnumeratedValue를 설명하고, 사용자 가이드 3.2.5가 ORDINAL/STRING 정의와 컨버터 제약을 설명한다. (보충) 순서 변경 시 데이터 의미가 어긋난다는 설명은 문서 문장이 아니라 ORDINAL 정의로부터의 추론이다. @EnumeratedValue는 7.0 문서 기준이라 버전 의존이다.
