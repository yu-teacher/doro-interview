---
slug: "ioc-18"
topic: "ioc-di"
tier: TRICKY
difficulty: 3
title: "@Autowired(required = false)와 Optional, @Nullable은 어떻게 다른가요?"
keywords: ["required=false", "Optional", "@Nullable", "컬렉션은 최소 1개 기대"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
기본적으로 의존성이 없으면 시작이 실패합니다. 선택적 의존성에는 세 가지 표현이 있습니다. @Autowired(required=false)는 필드면 기본값을 유지하고 메서드면 의존성이 없을 때 호출하지 않습니다. Optional<T>와 파라미터의 @Nullable은 생성자나 메서드 인자에서 의존성이 없을 때 빈 값이나 null을 받는 방식입니다. 생성자 주입에서는 Optional이나 @Nullable이 자연스럽고, 세터 주입에서는 required=false를 씁니다. 컬렉션은 기본적으로 매칭되는 요소가 하나 이상 있어야 합니다.

- (공식 문서) 위 내용. 단일 생성자 상황에서 매칭 빈이 없으면 빈 컬렉션이 주입된다는 예외도 문서에 있다.
