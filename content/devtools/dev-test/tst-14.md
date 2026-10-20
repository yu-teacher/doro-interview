---
slug: "tst-14"
topic: "dev-test"
tier: DEEP
difficulty: 2
title: "JUnit 5는 테스트 메서드마다 인스턴스를 새로 만든다는데, 왜 그렇고 `@TestInstance(PER_CLASS)`는 무엇을 바꾸나요?"
keywords: ["메서드마다 새 인스턴스", "테스트 격리", "PER_CLASS는 인스턴스 하나", "비static @BeforeAll 가능", "필드 상태가 남음"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.junit.org/5.14.4/writing-tests/test-instance-lifecycle.html", "https://docs.junit.org/5.14.4/writing-tests/annotations.html", "https://docs.junit.org/5.14.4/writing-tests/test-execution-order.html"]
concepts: [mocking-junit]
importance: 1
links: [{to: "tst-03", kind: PREREQ}]
---
**모범 답변 (30~60초)**
기본 모드인 `PER_METHOD`에서는 JUnit이 테스트 메서드를 실행할 때마다 테스트 클래스 인스턴스를 새로 만듭니다. 그래서 한 테스트가 인스턴스 필드를 바꿔도 다음 테스트에는 영향이 없어서, 가변 상태 때문에 생기는 테스트 사이 부작용을 줄입니다. `@TestInstance(Lifecycle.PER_CLASS)`를 붙이면 클래스당 인스턴스가 하나만 만들어지고 모든 테스트가 그것을 공유하므로, 필드 상태가 테스트 사이에 남아서 `@BeforeEach`에서 초기화해야 합니다. 대신 `@BeforeAll`과 `@AfterAll`을 비static 메서드로 쓸 수 있습니다. 공식 문서도 진짜 단위 테스트는 실행 순서에 기대지 않는 것이 보통이라고 하므로, 공유 상태에 기대는 테스트는 조심해서 씁니다.

(공식 문서) JUnit 5.14.4 Test Instance Lifecycle 페이지는 개별 테스트를 격리해서 실행하고 가변 인스턴스 상태의 부작용을 피하려고 테스트 메서드마다 새 인스턴스를 만들며, 이것이 기본 per-method 모드라고 설명한다. `@TestInstance(Lifecycle.PER_CLASS)`는 클래스당 한 번만 인스턴스를 만들고, 그 모드에서는 인스턴스 변수 상태를 `@BeforeEach`나 `@AfterEach`에서 초기화해야 할 수 있으며 `@BeforeAll`과 `@AfterAll`을 비static 메서드로 선언할 수 있다고 한다. Test Execution Order 페이지는 메서드 순서가 기본으로는 결정적이지만 일부러 알기 어렵게 정해지며, 진짜 단위 테스트는 보통 실행 순서에 기대지 않아야 한다고 한다.
(실험 확인) JUnit 5.12.2에서 기본 모드의 두 테스트는 서로 다른 인스턴스(객체 해시가 다름)에서 실행되어 `counter++` 결과가 둘 다 1이었고, `PER_CLASS`에서는 같은 인스턴스에서 1과 2였다. 기본 모드여도 `static` 필드는 공유되어 첫 테스트가 넣은 값이 둘째 테스트에 보였다. 순서 지정이 없을 때 실행 순서는 선언 순서나 알파벳 순서가 아니라 `mid`, `beta`, `zeta`, `alpha`였다(같은 순서가 JUnit 6.0.3에서도 나왔고, 기본 모드의 새 인스턴스와 `PER_CLASS`의 인스턴스 공유도 6.0.3에서 같았다).
