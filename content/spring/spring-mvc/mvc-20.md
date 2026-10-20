---
slug: "mvc-20"
topic: "spring-mvc"
tier: TRICKY
difficulty: 3
title: "전역 예외 핸들러에서 `Exception`을 한꺼번에 잡으면 어떤 문제가 생기나요?"
keywords: ["구체적 예외 타입", "예외 래핑", "getCause", "마지막 방어선"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-exceptionhandler.html"]
concepts: [global-exception-handling, exception-handling]
importance: 2
links: [{to: "mvc-10", kind: PREREQ}]
---
**모범 답변 (30~60초)**
핸들러를 너무 넓게 잡으면 의도치 않은 예외까지 한곳에서 처리해 원인 파악이 어려워지고, 상태 코드도 일괄 500 같은 값으로 뭉개질 수 있습니다. 문서도 핸들러 인자 타입은 가능한 한 구체적으로 선언하고, 여러 예외를 한 메서드가 받는 대신 예외별 핸들러로 나누라고 권합니다. 래핑된 예외 상황에서 `Exception` 인자를 받으면 항상 래퍼 예외가 들어오므로 `getCause()`로 실제 원인을 직접 찾아야 하는 번거로움도 있습니다. 그래서 알려진 비즈니스 예외는 구체적으로 먼저 처리하고, 일반 `Exception` 핸들러는 마지막 방어선으로만 두며 로그를 남기는 것이 좋습니다.

- (공식 문서) 루트 예외와 cause 예외 매칭의 구분은 헷갈릴 수 있다. 어노테이션에 여러 구체 예외 타입을 나열하고 `Exception` 같은 아주 일반적인 인자를 받는 핸들러는, 래핑 시나리오에서 항상 래퍼 예외로 호출되고 실제로 매칭된 예외는 `ex.getCause()`로 찾아야 한다. 그 예외가 최상위로 던져질 때만 인자가 실제 예외 인스턴스다. 문서는 인자 시그니처를 가능한 한 구체적으로 하고, 여러 예외를 받는 메서드를 단일 예외 타입별 `@ExceptionHandler`로 나누는 것을 고려하라고 권한다.
- (보충) "상태 코드가 일괄 500으로 뭉개질 수 있다", "원인 파악이 어려워진다", "마지막 방어선 + 로그" 권고는 공식 문서가 아니라 실무적 제안이다.
