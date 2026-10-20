---
slug: "pat-14"
topic: "design-pattern"
tier: TRICKY
difficulty: 2
title: "`Collections.unmodifiableList`로 감싼 리스트는 불변 리스트인가요? `List.of`와는 무엇이 다른가요?"
keywords: ["원본에 대한 읽기 전용 뷰", "원본 변경이 그대로 보임", "복사본이 아님", "List.copyOf", "요소가 가변이면 내용이 변함"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/Collections.html", "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/List.html"]
---
**모범 답변 (30~60초)**
불변 리스트가 아니라 원본에 대한 읽기 전용 뷰입니다. 문서에 따르면 조회는 원본으로 read through 되므로 원본을 바꾸면 뷰에도 그대로 보이고, 뷰를 통해 수정하려는 시도만 `UnsupportedOperationException`을 던집니다. 반면 `List.of`와 `List.copyOf`로 만든 리스트는 요소를 추가·삭제·교체할 수 없고 null을 허용하지 않습니다. 다만 요소 자체가 가변이면 리스트 내용이 바뀌어 보일 수 있다고 문서가 알려 줍니다. 원본과 분리된 값이 필요하면 `List.copyOf`를 쓰는 편이 안전합니다.

```java
List<String> base = new ArrayList<>(List.of("a", "b"));
List<String> view = Collections.unmodifiableList(base);
List<String> copy = List.copyOf(base);
base.add("c");
// view = [a, b, c]   copy = [a, b]
view.add("x");   // UnsupportedOperationException
```

(공식 문서) `Collections.unmodifiableList` 문서는 지정한 리스트의 수정 불가 뷰를 돌려주고, 조회 연산은 원본으로 read through 되며 수정 시도는 직접이든 이터레이터를 통해서든 `UnsupportedOperationException`을 던진다고 한다. `List` 문서의 Unmodifiable Lists 절은 `List.of`와 `List.copyOf`가 만든 리스트는 수정할 수 없고 null을 허용하지 않으며, 담긴 요소가 가변이면 내용이 바뀌어 보일 수 있다고 한다.
(실험 확인) 위 코드에서 원본에 `c`를 추가하자 뷰에는 보였지만 `copyOf` 결과에는 보이지 않았고, 뷰에 `add`하면 `UnsupportedOperationException`이었다. `List.of(new StringBuilder("m"))`의 요소에 `append("!")`를 하자 리스트가 `[m!]`로 보였다.
(보충) 방어적 복사에는 `List.copyOf`가 안전하다는 선택 기준은 위 문서 내용에서 이끌어 낸 일반적인 실무 권장이다.
