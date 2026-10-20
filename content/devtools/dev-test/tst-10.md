---
slug: "tst-10"
topic: "dev-test"
tier: DEEP
difficulty: 2
title: "예외가 발생하는지 어떻게 검증하나요? `assertThrows`, `assertThrowsExactly`, AssertJ의 `assertThatThrownBy`는 어떻게 다른가요?"
keywords: ["assertThrows는 하위 타입 허용", "assertThrowsExactly는 정확한 타입", "반환된 예외로 메시지 검증", "던지지 않으면 실패", "assertThatThrownBy 체이닝"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.junit.org/5.14.4/writing-tests/exception-handling.html", "https://docs.junit.org/5.14.4/writing-tests/assertions.html", "https://assertj.github.io/doc/"]
concepts: [mocking-junit, exception-handling]
importance: 2
links: [{to: "tst-07", kind: PREREQ}]
---
**모범 답변 (30~60초)**
`assertThrows(타입, 실행코드)`는 코드를 실행해서 그 타입이나 하위 타입의 예외가 던져졌는지 검사하고, 던져진 예외를 돌려주기 때문에 메시지나 원인을 이어서 검증할 수 있습니다. 예외가 아예 안 나오거나 다른 타입이 나오면 테스트가 실패합니다. `assertThrowsExactly`는 하위 타입을 허용하지 않고 정확히 그 타입만 인정합니다. AssertJ의 `assertThatThrownBy(() -> ...)`는 같은 검증을 `isInstanceOf(...).hasMessageContaining(...)`처럼 체이닝으로 쓰게 하고, 예외가 안 나오면 즉시 단언 오류를 냅니다. 어느 쪽이든 `try-catch`에 `fail()`을 넣는 방식보다 의도가 분명합니다.

```java
IllegalArgumentException e = assertThrows(IllegalArgumentException.class,
        () -> { throw new IllegalArgumentException("boom"); });
assertEquals("boom", e.getMessage());
assertThatThrownBy(() -> { throw new IllegalArgumentException("boom"); })
        .isInstanceOf(RuntimeException.class)
        .hasMessageContaining("boom");
```

(공식 문서) JUnit 5.14.4 Exception Handling 페이지는 `assertThrows`가 지정한 타입과 그 하위 타입을 모두 허용하고 던져진 예외를 반환하며, `assertThrowsExactly`는 하위 타입을 허용하지 않는다고 설명한다. AssertJ 공식 문서는 `assertThatThrownBy`가 `catchThrowable`의 대안이고 전달한 코드가 예외를 내지 않으면 단언 오류를 즉시 던진다고 한다.
(실험 확인) JUnit 5.12.2에서 `IllegalArgumentException`을 던지는 코드에 `assertThrows(RuntimeException.class, ...)`는 통과했고 `assertThrowsExactly(RuntimeException.class, ...)`는 `Unexpected exception type thrown, expected: <java.lang.RuntimeException> but was: <java.lang.IllegalArgumentException>`로 실패했다. 아무것도 던지지 않는 코드는 `Expected java.lang.IllegalStateException to be thrown, but nothing was thrown.`으로 실패했다. AssertJ 3.27.6의 `assertThatThrownBy`도 하위 타입은 통과시켰고 아무것도 던지지 않으면 실패했다(6.0.3 실행에서 메시지는 `Expecting code to raise a throwable.`). 위 코드 블록의 두 단언은 그대로 실행해 통과했다.
(보충) `try-catch`와 `fail()`을 쓰는 방식보다 의도가 분명하다는 것은 일반적인 코드 스타일 설명이다.
