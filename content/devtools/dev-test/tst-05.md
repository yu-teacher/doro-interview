---
slug: "tst-05"
topic: "dev-test"
tier: BASIC
difficulty: 1
title: "Mockito에서 `when().thenReturn()`과 `verify()`는 각각 무엇을 하고, 스텁하지 않은 메서드는 무엇을 반환하나요?"
keywords: ["when thenReturn 스터빙", "verify 호출 검증", "스텁 안 한 메서드는 null·0·false", "인자 매처 anyInt", "ArgumentCaptor"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://javadoc.io/static/org.mockito/mockito-core/5.23.0/org.mockito/org/mockito/Mockito.html"]
---
**모범 답변 (30~60초)**
`when(mock.find(1)).thenReturn("kim")`은 이 호출이 오면 이 값을 돌려주라고 미리 정해 두는 스터빙이고, `verify(mock).find(1)`은 실제로 그 호출이 일어났는지 확인하는 검증입니다. `verify`는 기본이 정확히 한 번이고 `times`, `never`, `atLeast`로 횟수를 바꿉니다. 스텁하지 않은 메서드는 값을 반환할 때 대체로 객체는 `null`, 기본형은 `0`이나 `false`, 컬렉션은 빈 컬렉션을 돌려줍니다. 인자는 `equals`로 비교하고, 유연하게 맞추려면 `anyInt()` 같은 매처를 쓰되 한 호출에서는 인자를 전부 매처로 쓰거나 전부 실제 값으로 써야 합니다. 인자를 꺼내서 따로 검사하려면 `ArgumentCaptor`를 씁니다.

(공식 문서) Mockito 5.23.0 Javadoc 1~4절은 `when().thenReturn()` 스터빙, `verify()` 검증과 `times(1)`이 기본이라는 점, 스텁하지 않은 메서드의 기본 반환값(`null`, 기본형·래퍼의 `0`/`false`, 적절한 빈 컬렉션), `equals` 기반 인자 비교, 매처를 쓰면 모든 인자가 매처여야 한다는 규칙을 설명한다. 15절은 `ArgumentCaptor`가 검증과 함께 쓰기에 알맞고 스터빙에는 권장하지 않는다고 한다.
(실험 확인) Mockito 5.23.0에서 스텁하지 않은 `Repo.find(1)`은 `null`이었고 `mock(List.class)`의 `size()`는 0, `get(0)`은 `null`이었다. `List.subList(anyInt(), 3)`처럼 매처와 실제 값을 섞어 스터빙하면 `InvalidUseOfMatchersException`이 났고, `ArgumentCaptor.forClass(String.class)`로 `save("hello")`의 인자 `hello`를 꺼냈다. 반환 타입이 `Optional<String>`인 스텁하지 않은 메서드는 `null`이 아니라 `Optional.empty`, 배열은 `null`, `Map`은 빈 맵이었다(공식 문서는 이 구분을 따로 적지 않고 '적절한' 값이라고만 한다). 인자 매처만 쓴 `when(l.set(eq(0), anyString()))`은 정상이었고, 같은 인자로 두 번 호출된 메서드를 기본 `verify(r).find(1)`로 검증하면 `TooManyActualInvocations`로 실패했고 `atLeast(2)`는 통과했다.
