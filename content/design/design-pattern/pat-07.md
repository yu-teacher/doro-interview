---
slug: "pat-07"
topic: "design-pattern"
tier: BASIC
difficulty: 1
title: "전략 패턴은 무엇이고 `Comparator`는 어떻게 그 예가 되나요?"
keywords: ["동작 일부를 별도 객체로 분리", "런타임에 교체", "상태 없는 알고리즘 객체", "정렬 알고리즘과 기준 분리", "람다로 전달"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://gameprogrammingpatterns.com/state.html", "https://gameprogrammingpatterns.com/component.html", "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/Comparator.html"]
---
**모범 답변 (30~60초)**
전략 패턴은 객체 동작의 일부를 별도의 하위 객체에 맡겨서 주 클래스와 분리하는 패턴입니다. Nystrom은 전략의 목적을 주 클래스를 그 동작 일부에서 떼어 내는 것이라고 설명하고, 전략 객체는 보통 상태 없이 알고리즘만 담는다고 말합니다. `Comparator`가 대표적인 예입니다. 정렬 알고리즘은 `List.sort`가 맡고, 정렬 기준만 `Comparator`로 바꿔 끼웁니다. `Comparator`는 함수형 인터페이스라서 람다나 메서드 참조로 바로 전달할 수 있습니다.

```java
ps.sort(Comparator.comparingInt(Person::age));                 // 기준 1
ps.sort(Comparator.comparing(Person::name).reversed());        // 기준 2, 같은 정렬 알고리즘
```

(원저자 자료) Nystrom, Game Programming Patterns, "State" 장: 전략·타입 객체·상태는 모두 주 객체가 하위 객체에 위임하는 구조지만 의도가 다르며, 전략의 목적은 주 클래스를 동작 일부에서 분리하는 것이라고 한다. "Component" 장은 전략 객체가 보통 상태 없이 알고리즘만 담는다는 점을 짚는다.
(공식 문서) `Comparator` 문서는 컬렉션의 순서를 정하는 비교 함수이고, 정렬 메서드나 정렬 컬렉션에 넘겨 순서를 제어하며, 함수형 인터페이스라고 설명한다.
(실험 확인) 같은 `List.sort` 호출에 나이순 `Comparator`와 이름 역순 `Comparator`를 바꿔 넘기자 결과 순서가 각각 달랐다.
(보충) JDK 문서는 `Comparator`를 전략 패턴이라고 부르지 않는다. 위 대응은 Nystrom의 정의에 비추어 본 해석이다.
