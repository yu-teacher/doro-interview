---
slug: "tst-07"
topic: "dev-test"
tier: BASIC
difficulty: 1
title: "JUnit의 `assertEquals` 같은 단언과 AssertJ의 `assertThat`은 무엇이 다르고, 왜 AssertJ를 많이 쓰나요?"
keywords: ["static 단언 메서드", "assertThat 체이닝", "읽기 쉬운 실패 메시지", "소프트 단언", "assertAll"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.junit.org/5.14.4/writing-tests/assertions.html", "https://assertj.github.io/doc/", "https://docs.spring.io/spring-boot/reference/testing/test-scope-dependencies.html", "https://javadoc.io/static/org.assertj/assertj-core/3.27.6/org/assertj/core/api/SoftAssertions.html"]
concepts: [mocking-junit]
importance: 2
links: [{to: "tst-10", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
JUnit Jupiter는 `Assertions` 클래스에 `assertEquals`, `assertTrue`, `assertThrows` 같은 static 메서드를 두고, 실패하면 `AssertionError`를 던집니다. AssertJ는 `assertThat(값)`에서 시작해 `hasSize(2).contains("x")`처럼 값의 타입에 맞는 단언을 이어 붙이는 라이브러리로, 컬렉션, 문자열, 예외, 객체 필드 비교까지 풍부한 단언과 읽기 쉬운 실패 메시지를 줍니다. JUnit도 `assertAll`로 여러 단언을 묶어 한꺼번에 보고하고, AssertJ는 `SoftAssertions`로 같은 일을 합니다. JUnit 문서도 더 강력한 단언이 필요하면 AssertJ 같은 라이브러리를 쓰라고 권하고, Spring Boot 테스트 스타터에도 AssertJ가 들어 있습니다.

(공식 문서) JUnit User Guide의 Assertions 페이지는 단언이 `org.junit.jupiter.api.Assertions`의 static 메서드이고 `assertAll`로 묶은 단언이 모두 실행되어 실패가 함께 보고된다고 하며, 더 많은 기능이 필요하면 AssertJ, Hamcrest, Truth 같은 서드파티 단언 라이브러리를 권장한다고 한다. AssertJ 공식 문서(user guide)는 풍부한 단언과 도움이 되는 오류 메시지를 내세우고, `assertThat` 체이닝, `as()`로 설명 붙이기, `usingRecursiveComparison()`을 소개한다. 소프트 단언은 user guide 본문에서 찾지 못했고(안드로이드 호환성 문장에서 언급만 됨), AssertJ 3.27.6 `SoftAssertions` Javadoc이 JUnit 같은 프레임워크는 첫 실패에서 멈추므로 모든 단언 결과를 한 번에 얻도록 `SoftAssertions`를 쓴다고 설명한다. Spring Boot 4.1.1 테스트 문서는 `spring-boot-starter-test`가 JUnit, AssertJ, Hamcrest, Mockito 등을 포함한다고 한다.
(실험 확인) JUnit 5.12.2와 AssertJ 3.27.6에서 `assertThat(List.of("x","y")).hasSize(2).contains("z")`의 실패 메시지는 기대한 요소 `["z"]`를 찾지 못했다고 구체적으로 알려 줬지만, `assertTrue(list.containsAll(...))`는 `expected: <true> but was: <false>`뿐이었다. `assertAll`과 `SoftAssertions`는 실패 둘을 함께 보고했고, `assertEquals` 두 줄을 이어 쓰면 첫 실패에서 멈췄다. `usingRecursiveComparison()`은 `age` 필드가 다르다고 필드 이름까지 알려 줬다.
