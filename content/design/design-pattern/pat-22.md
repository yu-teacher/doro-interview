---
slug: "pat-22"
topic: "design-pattern"
tier: DEEP
difficulty: 2
title: "이터레이터 패턴은 무엇이고, 자바에서는 `Iterable`·`Iterator`로 어떻게 쓰이나요? 향상된 for 문에서 삭제하면 왜 예외가 나나요?"
keywords: ["내부 구조를 숨기고 순회", "Iterable과 향상된 for 문", "Iterator.remove", "fail-fast", "ConcurrentModificationException"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/Iterator.html", "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Iterable.html", "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/ArrayList.html", "https://docs.oracle.com/javase/specs/jls/se25/html/jls-14.html"]
concepts: [java-collections, gof-patterns]
importance: 2
links: [{to: "jc-11", kind: RELATED}]
---
**모범 답변 (30~60초)**
이터레이터는 컬렉션의 내부 구조를 드러내지 않고 요소를 하나씩 순회하게 해 주는 객체입니다. 자바에서는 `Iterable`을 구현하면 향상된 for 문의 대상이 되고, JLS는 이 문을 `iterator()`로 얻은 이터레이터를 도는 코드로 번역한다고 규정합니다. `Iterator`는 순회 중 요소 삭제를 정의된 방식으로 허용합니다. `ArrayList`의 이터레이터는 fail-fast라서, 순회 중 이터레이터 자신의 메서드가 아닌 `list.remove` 같은 방법으로 구조를 바꾸면 `ConcurrentModificationException`을 던질 수 있습니다. 다만 문서는 이 동작이 보장되지 않는다고 하므로, 순회 중 삭제는 `Iterator.remove`로 하는 편이 안전합니다.

```java
List<Integer> l = new ArrayList<>(List.of(1, 2, 3, 4));
for (Iterator<Integer> it = l.iterator(); it.hasNext();)
    if (it.next() % 2 == 0) it.remove();      // [1, 3]
// for (Integer x : l) if (x == 2) l.remove(x);  -> ConcurrentModificationException
```

(공식 문서) `Iterator` 문서는 컬렉션 위의 이터레이터이며 `Enumeration`을 대체하고, 순회 중 기초 컬렉션에서 요소를 잘 정의된 의미로 제거할 수 있다는 점과 개선된 메서드 이름이 `Enumeration`과의 차이라고 한다. `Iterable` 문서는 이 인터페이스를 구현하면 향상된 for 문의 대상이 될 수 있다고 하고, JLS 14.14.2는 `Iterable` 하위 타입에 대한 향상된 for 문이 `Expression.iterator()`로 얻은 이터레이터의 `hasNext`/`next`를 부르는 기본 for 문으로 번역된다고 규정한다. `ArrayList` 문서는 이터레이터가 fail-fast이며 이터레이터 생성 후 자신의 `remove`/`add` 이외로 리스트가 구조적으로 바뀌면 `ConcurrentModificationException`을 던지지만, 동기화 없는 동시 수정에서는 fail-fast 동작을 보장할 수 없다고 한다.
(실험 확인) 사용자 정의 `Iterable`(0부터 4 미만)을 향상된 for 문에서 순회해 합계 6을 얻었다. 요소가 4개인 `ArrayList`를 for-each로 순회하며 요소 2를 지우자 `ConcurrentModificationException`이었고, `Iterator.remove`로 짝수를 지우면 `[1, 3]`이었다. 요소가 3개일 때 for-each 중 두 번째 요소(끝에서 두 번째)를 지우면 예외 없이 `[1, 3]`이 되었다. fail-fast는 최선 노력일 뿐이라는 문서 설명과 일치한다. 빈 이터레이터의 `next()`는 `NoSuchElementException`이었다(Corretto 25.0.3).
(보충) 이터레이터 패턴의 일반 정의는 GoF 원서를 읽지 못해 일반적으로 알려진 설명이다.
