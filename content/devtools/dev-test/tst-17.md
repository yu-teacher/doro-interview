---
slug: "tst-17"
topic: "dev-test"
tier: TRICKY
difficulty: 3
title: "Mockito에서 `UnnecessaryStubbingException`이 나는 이유와 해결 방법은? (strict stubs)"
keywords: ["사용되지 않은 스터빙 보고", "STRICT_STUBS", "인자 불일치 PotentialStubbingProblem", "lenient()", "MockitoExtension 기본 적용"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://javadoc.io/static/org.mockito/mockito-core/5.23.0/org.mockito/org/mockito/exceptions/misusing/UnnecessaryStubbingException.html", "https://javadoc.io/static/org.mockito/mockito-core/5.23.0/org.mockito/org/mockito/quality/Strictness.html", "https://javadoc.io/static/org.mockito/mockito-junit-jupiter/5.23.0/org.mockito.junit.jupiter/org/mockito/junit/jupiter/MockitoExtension.html", "https://javadoc.io/static/org.mockito/mockito-core/5.23.0/org.mockito/org/mockito/Mockito.html"]
---
**모범 답변 (30~60초)**
테스트에서 `when(...)`으로 스터빙했는데 실행 중 한 번도 쓰이지 않으면, 엄격 스터빙(`STRICT_STUBS`)이 켜진 상태에서는 Mockito가 `UnnecessaryStubbingException`으로 테스트를 실패시킵니다. 쓸모없는 테스트 코드나 복사 붙여넣기 실수를 잡으려는 동작입니다. 스터빙한 메서드를 다른 인자로 호출한 경우에도 인자 불일치를 `PotentialStubbingProblem`으로 알려 줍니다. 해결은 필요 없는 스터빙을 지우거나 테스트와 대상 코드의 오해를 바로잡는 것이고, 정말 공통 준비라 일부 테스트에서만 쓰인다면 `lenient().when(...)`으로 그 스터빙만 완화합니다. `MockitoExtension`을 쓰면 이 모드가 적용되고, `mock()`만 직접 쓰면 에러가 나지 않았습니다.

```java
@ExtendWith(MockitoExtension.class)
class GreetTest {
    @Mock Repo repo;
    @Test void lenientExample() {
        lenient().when(repo.find(2)).thenReturn("lee"); // 안 쓰여도 통과
        when(repo.find(1)).thenReturn("kim");           // 안 쓰이면 UnnecessaryStubbingException
    }
}
```

(공식 문서) Mockito의 `UnnecessaryStubbingException` Javadoc은 실행 중 실현되지 않은 스터빙을 보고하며, 오탐이면 개별 스터빙은 `Mockito.lenient()`, 목 단위는 `MockSettings.lenient()`, 테스트 범위는 JUnit 지원의 설정으로 완화할 수 있다고 설명한다. `Strictness` Javadoc은 `STRICT_STUBS`가 불필요한 스터빙을 보고하고 인자 불일치를 감지한다고 하고, 메인 Javadoc 46절은 `lenient().when(mock.foo()).thenReturn("ok")` 예를 든다. `MockitoExtension` Javadoc은 이 확장이 엄격 스터빙을 처리하고 `@MockitoSettings`로 strictness를 바꿀 수 있다고 한다.
(실험 확인) Mockito 5.23.0과 JUnit 5.12.2에서 `@ExtendWith(MockitoExtension.class)` 테스트가 `find(1)`과 쓰이지 않는 `find(2)`를 스터빙하니 `UnnecessaryStubbingException`으로 실패했다. `find(1)`만 스터빙하고 `find(2)`를 호출하면 `PotentialStubbingProblem`으로 실패했고, 안 쓰는 스터빙을 `lenient()`로 바꾸면 통과했다. 확장 없이 `mock()`으로 만든 목에서 안 쓰는 스터빙을 둬도 통과했다.
