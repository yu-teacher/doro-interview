---
slug: "pat-06"
topic: "design-pattern"
tier: DEEP
difficulty: 2
title: "`Stream.Builder`나 `StringBuilder` 같은 빌더는 왜 쓰고, 쓸 때 주의할 점은 무엇인가요?"
keywords: ["가변 빌더로 단계적 조립", "build 이후 추가 불가", "임시 버퍼 복사 비용 회피", "스레드 안전하지 않음", "플루언트 인터페이스"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/stream/Stream.Builder.html", "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/StringBuilder.html", "https://martinfowler.com/bliki/FluentInterface.html"]
concepts: [gof-patterns, string]
importance: 2
links: [{to: "jl-05", kind: RELATED}]
---
**모범 답변 (30~60초)**
빌더는 값을 하나씩 채워 가며 조립한 뒤 완성된 객체를 만들어 내는 가변 객체입니다. `Stream.Builder` 문서는 원소를 하나씩 넣으면서 `ArrayList` 같은 임시 버퍼의 복사 비용을 피할 수 있고, 빌딩 단계 다음에 `build()`로 빌트 단계로 넘어가면 더는 원소를 추가할 수 없는 생명주기를 가진다고 설명합니다. `StringBuilder`도 가변이라 단일 스레드에서 쓰도록 안내되어 있고 동기화를 보장하지 않습니다. 메서드 체이닝 빌더는 Fowler가 말한 플루언트 인터페이스에서 문맥 안에서만 쓰는 보조 객체로 거론됩니다.

```java
Stream.Builder<String> b = Stream.builder();
b.add("a").add("b");
Stream<String> s = b.build();
b.add("d");     // IllegalStateException
```

(공식 문서) `Stream.Builder` 문서는 가변 빌더이며 임시 `ArrayList`의 복사 오버헤드 없이 스트림을 만들 수 있고, `build()`가 호출되면 빌트 단계가 되어 원소를 더 추가할 수 없다고 한다. `StringBuilder` 문서는 가변 문자 시퀀스이고, 여러 스레드가 쓰기에는 안전하지 않다고 한다.
(원저자 자료) Fowler, Fluent Interface 글: 플루언트 API의 메서드는 단독으로는 의미가 약하므로, 그 문맥에서만 쓰는 빌더 객체를 쓰는 방법이 대안이 될 수 있다고 쓴다.
(실험 확인) `build()` 뒤에 `add`를 호출하면 `IllegalStateException`이었고, `build()`를 한 번 더 호출해도 같은 예외였다. `StringBuilder` 하나에 스레드 4개가 각각 100,000번 `append('x')`를 했더니 기대한 400,000이 아니라 재실행에서도 237,438자만 남았다(실행마다 다른 값이며, 요지는 값이 모자란다는 것).
(보충) 빌더 패턴의 의도(복잡한 객체의 생성 과정을 표현과 분리)는 GoF 원서를 읽지 못해 일반적으로 알려진 설명을 적은 것이며, `StringBuilder`가 GoF 빌더 패턴의 구현이라는 주장은 하지 않는다.
