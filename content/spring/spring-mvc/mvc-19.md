---
slug: "mvc-19"
topic: "spring-mvc"
tier: TRICKY
difficulty: 3
title: "`@ControllerAdvice`가 여러 개일 때 어떤 것이 먼저 적용되나요?"
keywords: ["@Order", "루트 vs cause 매칭", "advice 우선순위"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
"한 advice 클래스나 컨트롤러 안에서는 루트 예외 매칭이 cause 매칭보다 우선합니다. 하지만 advice 빈들 사이에서는 우선순위가 높은 advice가 이깁니다. 심지어 높은 advice의 cause 매칭이 낮은 advice의 루트 매칭보다 먼저 선택됩니다. 그래서 문서는 주요 루트 예외 매핑을 둔 advice에 명시적으로 `@Order` 값을 주라고 권합니다. Boot의 ProblemDetail 핸들러는 order 0이라, 이를 덮어쓰려면 더 앞선 order의 advice를 둬야 합니다."

- (공식 문서) 위 모든 내용이 `@ExceptionHandler` 문서와 Problem Details 문서에 있습니다.
