---
slug: "tst-09"
topic: "dev-test"
tier: DEEP
difficulty: 2
title: "`@Nested`와 `@DisplayName`은 어떻게 쓰고, 중첩 클래스에서 `@BeforeEach`는 어떤 순서로 실행되나요?"
keywords: ["비정적 내부 클래스", "바깥 @BeforeEach 먼저", "계층적 준비 코드", "@DisplayName 가독성", "static @BeforeAll Java 16"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.junit.org/5.14.4/writing-tests/nested-tests.html", "https://docs.junit.org/5.14.4/writing-tests/display-names.html", "https://docs.junit.org/5.14.4/writing-tests/annotations.html"]
concepts: [mocking-junit]
importance: 1
links: [{to: "tst-03", kind: PREREQ}]
---
**모범 답변 (30~60초)**
`@Nested`는 비정적 내부 클래스를 테스트 그룹으로 만들어서 "새로 만든 스택일 때", "요소를 넣은 뒤" 같은 상황별로 테스트를 계층 구조로 묶게 해 줍니다. 안쪽 테스트가 실행되기 전에 바깥 클래스의 `@BeforeEach`가 먼저 실행되고 그다음 안쪽 `@BeforeEach`가 실행되므로, 준비 코드가 바깥에서 안쪽으로 쌓이고 안쪽 테스트만 단독으로 돌려도 바깥 준비가 항상 수행됩니다. `@DisplayName`은 공백이나 한글이 들어간 사람이 읽는 이름을 붙여서 리포트와 IDE 트리를 문장처럼 읽히게 합니다. `@Nested`로는 정적 중첩 클래스를 쓸 수 없고, `@BeforeAll`은 Java 16부터 `static`으로 둘 수 있습니다.

(공식 문서) JUnit 5.14.4 Nested Tests 페이지는 `@Nested`가 비정적 중첩 클래스만 가능하고, 바깥 테스트의 준비 코드가 안쪽 테스트 전에 실행되어 안쪽 테스트를 독립적으로 실행할 수 있다고 설명한다. Annotations 페이지는 Java 8~15에서는 per-class 라이프사이클이 아니면 `@Nested` 클래스에 `@BeforeAll`을 둘 수 없고 Java 16부터 `static`으로 둘 수 있다고 한다. Display Names 페이지는 `@DisplayName`이 공백, 특수문자, 이모지를 허용한다고 한다.
(실험 확인) JUnit 5.12.2, JDK 25에서 바깥 `@BeforeEach`가 있는 클래스 안에 `@Nested` 클래스와 그 안의 `@BeforeEach`를 두고 안쪽 테스트를 실행하니 outer beforeEach, inner beforeEach, 안쪽 테스트 순서였고, `@DisplayName("is empty")`가 결과 이름으로 보고되었다. `@Nested` 클래스에 `static @BeforeAll`을 두어도 실행되었다.
