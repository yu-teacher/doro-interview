---
slug: "tst-18"
topic: "dev-test"
tier: TRICKY
difficulty: 3
title: "Mockito spy에서 `when(spy.get(0))`으로 스터빙하면 왜 예외가 나고, `doReturn`은 무엇이 다른가요?"
keywords: ["spy는 실제 메서드 실행", "when 안에서 진짜 호출됨", "doReturn when 순서", "원본이 아닌 복사본", "@MockitoSpyBean"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://javadoc.io/static/org.mockito/mockito-core/5.23.0/org.mockito/org/mockito/Mockito.html", "https://docs.spring.io/spring-framework/reference/testing/annotations/integration-spring/annotation-mockitobean.html"]
---
**모범 답변 (30~60초)**
spy는 실제 객체를 감싸서 스터빙하지 않은 메서드는 진짜 메서드를 실행합니다. `when(spy.get(0)).thenReturn("foo")`는 괄호 안의 `spy.get(0)`이 먼저 실제로 호출되기 때문에, 빈 리스트라면 스터빙도 하기 전에 `IndexOutOfBoundsException`이 터지고, 부작용이 있는 메서드라면 그 부작용이 실제로 일어납니다. 그래서 `doReturn("foo").when(spy).get(0)`처럼 값을 먼저 정하고 호출 대상을 나중에 지정하면, 진짜 메서드를 호출하지 않고 스터빙할 수 있습니다. 또 Mockito는 넘긴 실제 객체에 위임하지 않고 복사본을 만들기 때문에, 원본을 따로 조작해도 spy에는 반영되지 않습니다. 스프링의 `@MockitoSpyBean`으로 만든 spy도 같은 이유로 `doReturn` 형태가 권장됩니다.

```java
List<String> spy = spy(new ArrayList<String>());
// when(spy.get(0)).thenReturn("foo");  // 진짜 get(0)이 먼저 실행되어 IndexOutOfBoundsException
doReturn("foo").when(spy).get(0);        // 진짜 메서드를 호출하지 않고 스터빙
```

(공식 문서) Mockito Javadoc의 spy 절은 spy에서 `when(Object)`로 스터빙하기가 불가능하거나 비현실적일 수 있어 `doReturn|Answer|Throw()` 계열을 쓰라고 하고, 빈 리스트의 `spy.get(0)`이 실제 메서드를 호출해 `IndexOutOfBoundsException`을 던지는 예를 보여 준다. 또 Mockito가 전달된 실제 인스턴스에 위임하지 않고 복사본을 만든다고 설명한다. Spring Framework의 `@MockitoSpyBean` 문서도 실제 메서드의 부작용을 피하려면 `doReturn(...).when(spy)` 형태를 고려하라고 안내한다.
(실험 확인) Mockito 5.23.0에서 `spy(new ArrayList<String>())`에 `when(spy.get(0)).thenReturn("foo")`를 하니 `IndexOutOfBoundsException: Index 0 out of bounds for length 0`이 났고, `doReturn("foo").when(spy).get(0)`은 성공해 `get(0)`이 `foo`를 돌려줬다. `spy.add("one")` 후 spy의 `size()`는 1, 원본 리스트의 `size()`는 0이었다.
