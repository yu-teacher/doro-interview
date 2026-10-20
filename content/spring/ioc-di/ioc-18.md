---
slug: "ioc-18"
topic: "ioc-di"
tier: TRICKY
difficulty: 3
title: "@Autowired(required = false)와 Optional, @Nullable은 어떻게 다른가요?"
keywords: ["required=false", "Optional", "@Nullable", "컬렉션은 최소 1개 기대"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/beans/annotation-config/autowired.html"]
concepts: [ioc-di, null-handling]
importance: 1
links: [{to: "ioc-04", kind: PREREQ}]
---
**모범 답변 (30~60초)**
기본적으로 @Autowired 필드나 메서드는 필수 의존성으로 취급되어, 만족시킬 빈이 없으면 주입이 실패합니다. 선택적 의존성에는 세 가지 표현이 있습니다. @Autowired(required=false)는 필드면 값을 채우지 않아 기본값을 유지하고, 메서드면 의존성이 없을 때 아예 호출하지 않습니다. java.util.Optional로 받거나 파라미터에 @Nullable을 붙이면 의존성이 없을 때 빈 Optional이나 null을 받습니다. 생성자와 팩토리 메서드 인자는 required의 의미가 조금 달라서 기본적으로 필수로 다뤄지되, 단일 생성자에서는 배열, 컬렉션, 맵 인자가 빈 인스턴스로 해석되는 예외가 있습니다. 컬렉션은 기본적으로 매칭 요소가 하나 이상 있어야 합니다.

- (공식 문서) 위 내용. required=false 필드는 아예 채워지지 않아 기본값이 유지되고, 비필수 메서드는 의존성 중 하나라도 없으면 호출되지 않는다. `Optional`과 파라미터 레벨 `@Nullable`(패키지 무관, 예: JSpecify)이 `required=false`의 대안으로 소개된다. 생성자 인자의 `required`는 생성자 해석 알고리즘 때문에 의미가 다르다.
