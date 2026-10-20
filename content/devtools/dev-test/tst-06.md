---
slug: "tst-06"
topic: "dev-test"
tier: BASIC
difficulty: 1
title: "`@Mock`, `@InjectMocks`, `@ExtendWith(MockitoExtension.class)`는 어떻게 함께 쓰나요?"
keywords: ["@Mock 가짜 의존성 생성", "@InjectMocks 대상 객체에 주입", "MockitoExtension이 초기화", "openMocks 직접 호출", "메서드 파라미터 목"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://javadoc.io/static/org.mockito/mockito-core/5.23.0/org.mockito/org/mockito/Mockito.html", "https://javadoc.io/static/org.mockito/mockito-core/5.23.0/org.mockito/org/mockito/InjectMocks.html", "https://javadoc.io/static/org.mockito/mockito-junit-jupiter/5.23.0/org.mockito.junit.jupiter/org/mockito/junit/jupiter/MockitoExtension.html"]
---
**모범 답변 (30~60초)**
`@Mock`은 의존성 자리에 쓸 목을 만들고, `@InjectMocks`는 테스트 대상 객체를 만들면서 그 목들을 주입합니다. 이 애노테이션들은 누군가 초기화해 줘야 동작하는데, JUnit 5에서는 테스트 클래스에 `@ExtendWith(MockitoExtension.class)`를 붙이면 확장이 목을 만들고 주입하며 엄격 스터빙 검사도 함께 해 줍니다. 확장을 안 쓰려면 `MockitoAnnotations.openMocks(this)`를 직접 호출해야 합니다. 이 확장은 `@Mock`을 테스트 메서드 파라미터로도 받아서, 한 테스트에서만 쓸 목을 지역적으로 만들 수 있습니다.

(공식 문서) Mockito Javadoc 9절은 `@Mock`이 반복되는 목 생성 코드를 줄이고 `MockitoAnnotations.openMocks(testClass)`나 러너·규칙 또는 JUnit 5 확장이 필요하다고 하고, 23절과 `InjectMocks` Javadoc은 `@InjectMocks`가 생성자, 세터, 필드 순으로 주입을 시도한다고 설명한다. `MockitoExtension` Javadoc은 이 확장이 목을 초기화하고 엄격 스터빙을 처리하며 `@Mock` 메서드·생성자 파라미터를 지원한다고 한다.
(실험 확인) Mockito 5.23.0에서 `@ExtendWith(MockitoExtension.class)`를 붙인 클래스는 `@Mock` 두 개와 `@InjectMocks`로 만든 `Svc`에 목이 주입되어 정상 동작했다. 확장도 `openMocks` 호출도 없는 클래스에서는 `@Mock`과 `@InjectMocks` 필드가 모두 `null`이었다. 확장을 붙인 클래스의 테스트 메서드 파라미터 `@Mock Repo local`도 스텁해서 쓸 수 있었다.
