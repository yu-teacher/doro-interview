---
slug: "tst-03"
topic: "dev-test"
tier: BASIC
difficulty: 1
title: "JUnit 5의 `@BeforeEach`, `@BeforeAll`, `@AfterEach`, `@AfterAll`은 각각 언제 실행되나요?"
keywords: ["@BeforeAll 클래스당 한 번", "@BeforeEach 메서드마다", "@BeforeAll은 static", "@AfterEach 테스트 뒤", "@AfterAll 모두 끝난 뒤"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.junit.org/5.14.4/writing-tests/test-classes-and-methods.html", "https://docs.junit.org/5.14.4/writing-tests/annotations.html", "https://docs.junit.org/5.14.4/writing-tests/test-instance-lifecycle.html"]
concepts: [mocking-junit]
importance: 2
links: [{to: "tst-14", kind: FOLLOWUP}, {to: "tst-02", kind: PREREQ}]
---
**모범 답변 (30~60초)**
`@BeforeAll`은 클래스의 모든 테스트가 시작되기 전에 한 번, `@AfterAll`은 모든 테스트가 끝난 뒤에 한 번 실행됩니다. `@BeforeEach`와 `@AfterEach`는 테스트 메서드 하나마다 그 앞과 뒤에 실행되어서, 테스트가 열 개면 열 번 돕니다. 기본 설정에서는 `@BeforeAll`과 `@AfterAll` 메서드가 `static`이어야 합니다. 그래서 순서는 BeforeAll, 그다음 테스트마다 BeforeEach와 테스트와 AfterEach를 반복하고, 마지막에 AfterAll입니다. 비용이 큰 준비는 `@BeforeAll`에, 테스트마다 새로 있어야 하는 상태는 `@BeforeEach`에 둡니다.

(공식 문서) Annotations 페이지는 `@BeforeEach`가 각 테스트 메서드 전에, `@BeforeAll`이 클래스의 모든 테스트 전에 실행되고 per-class 라이프사이클이 아니면 `static`이어야 한다고 설명한다. Test Classes and Methods 페이지는 테스트 클래스와 메서드, 생명주기 메서드가 `private`이 아니면 된다고 하고 모든 생명주기 메서드를 쓰는 예시를 보여 준다.
(실험 확인) JUnit 5.12.2와 6.0.3 양쪽에서 테스트가 둘인 클래스를 돌리면 beforeAll, beforeEach, 테스트 a, afterEach, beforeEach, 테스트 b, afterEach, afterAll 순서로 실행되었다. 기본 모드에서 `static`이 아닌 `@BeforeAll`을 두면 5.12.2에서는 그 클래스의 테스트가 하나도 실행되지 않고 클래스 단계에서 `must be static unless the test class is annotated with @TestInstance(Lifecycle.PER_CLASS)`라는 `JUnitException`으로 실패했고, 6.0.3에서는 같은 메시지가 테스트 발견 단계의 `DiscoveryIssueException`(critical issue)으로 보고되어 같이 지정한 다른 클래스도 실행되지 않았다.
(보충) 비용이 큰 준비는 BeforeAll에 둔다는 것은 일반적인 사용 요령이다.
