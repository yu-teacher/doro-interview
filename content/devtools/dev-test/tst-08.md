---
slug: "tst-08"
topic: "dev-test"
tier: DEEP
difficulty: 2
title: "`@ParameterizedTest`는 어떻게 쓰고, 값은 어떤 방식으로 공급할 수 있나요?"
keywords: ["junit-jupiter-params 의존성", "@ValueSource", "@CsvSource", "@MethodSource", "호출마다 개별 테스트로 보고"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.junit.org/5.14.4/writing-tests/parameterized-classes-and-tests.html", "https://docs.junit.org/5.14.4/writing-tests/annotations.html"]
concepts: [mocking-junit]
importance: 2
links: [{to: "tst-02", kind: PREREQ}]
---
**모범 답변 (30~60초)**
`@Test` 대신 `@ParameterizedTest`를 붙이고 인자 소스를 하나 이상 지정하면 같은 테스트 메서드가 인자만 바꿔 여러 번 실행됩니다. 이를 쓰려면 `junit-jupiter-params` 의존성이 필요합니다. 소스로는 값을 나열하는 `@ValueSource`, 쉼표로 구분한 여러 인자를 주는 `@CsvSource`, enum 상수를 쓰는 `@EnumSource`, null이나 빈 값을 주는 `@NullSource`와 `@EmptySource`, 팩토리 메서드가 `Stream<Arguments>`를 돌려주는 `@MethodSource`가 있습니다. 각 호출은 개별 테스트로 보고돼서 어떤 값에서 실패했는지 따로 보이므로, 같은 검증을 경계값 여러 개에 반복할 때 유용합니다.

```java
@ParameterizedTest
@ValueSource(strings = {"racecar", "radar", "abc"}) // "abc"만 실패하고 따로 보고됨
void palindrome(String s) {
    assertEquals(s, new StringBuilder(s).reverse().toString());
}
```

(공식 문서) JUnit 5.14.4의 Parameterized 페이지는 `@ParameterizedTest`를 쓰려면 소스를 하나 이상 선언해야 하고 `junit-jupiter-params` 아티팩트가 필요하다고 설명한다. `@ValueSource`, `@CsvSource`, `@EnumSource`, `@NullSource`, `@EmptySource`, `@MethodSource`를 소개하며, `@MethodSource` 팩토리 메서드는 테스트 클래스가 `PER_CLASS`가 아니면 `static`이어야 한다고 한다.
(실험 확인) JUnit 5.12.2에서 `@ValueSource(strings = {"racecar", "radar", "abc"})`는 `[1] racecar`, `[2] radar`, `[3] abc` 세 개의 개별 결과로 보고되었고(컴파일에 `-parameters`를 주면 `[1] s=racecar`처럼 인자 이름이 붙음), 세 번째만 `expected: <abc> but was: <cba>`로 실패했다. `@CsvSource({"1,2,3", "2,2,5", "0,0,0"})`에 `name = "{0} + {1} = {2}"`를 주니 `2 + 2 = 5`만 실패로 표시됐다. 같은 코드를 6.0.3에서 돌리면 호출별 개별 보고와 실패 지점은 같았지만 문자열 인자는 `[1] "racecar"`처럼 따옴표가 붙어 표시되었다.
