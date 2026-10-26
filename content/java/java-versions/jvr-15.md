---
slug: "jvr-15"
topic: "java-versions"
tier: DEEP
difficulty: 2
title: "Stream Gatherers(Java 24)는 무엇이고 어떤 문제를 푸나요?"
keywords: ["사용자 정의 중간 연산", "stream.gather(Gatherer)", "windowFixed·scan·fold·mapConcurrent", "상태를 가질 수 있음", "Java 22 프리뷰에서 24 정식"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://openjdk.org/jeps/485", "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/stream/Stream.html"]
concepts: [lambda-stream]
importance: 1
links: [{to: "jvr-02", kind: PREREQ}, {to: "js-04", kind: RELATED}]
---
**모범 답변 (30~60초)**
Stream Gatherers는 Java 24에서 정식이 된, 스트림의 사용자 정의 중간 연산입니다. 내장 중간 연산만으로는 요소를 3개씩 묶거나 특정 키 기준으로 중복을 제거하는 작업을 표현하기 어려워서, `stream.gather(Gatherer)`로 중간 연산을 직접 만들거나 내장 제공 연산을 쓰게 했습니다. `Gatherers`에 `windowFixed`, `windowSliding`, `fold`, `scan`, `mapConcurrent` 같은 표준 구현이 있고, 상태를 가질 수 있으며 가능한 한 무한 스트림도 다룰 수 있게 설계됐습니다. Java 22와 23의 프리뷰를 거쳐 24에서 확정됐습니다.

```java
Stream.of(1,2,3,4,5,6,7).gather(Gatherers.windowFixed(3)).toList();
// [[1, 2, 3], [4, 5, 6], [7]]
```

(공식 문서) JEP 485는 사용자 정의 중간 연산을 지원하도록 Stream API를 확장하는 것이 목적이고, 내장 연산으로는 `distinct`가 객체 동등성만 쓰는 등 표현하기 어려운 작업이 있다고 설명한다. JDK 22의 JEP 461, 23의 JEP 473 프리뷰를 거쳐 24에서 정식이 되었고(Release 24), 무한 스트림 조작을 가능한 한 허용하는 것이 목표다. `Stream.gather`의 Javadoc Since는 24다.
(실험 확인) JDK 25에서 `windowFixed(3)`은 `[[1, 2, 3], [4, 5, 6], [7]]`, `windowSliding(2)`는 `[[1, 2], [2, 3], [3, 4], [4, 5]]`, `scan(() -> 0, (s, x) -> s + x)`는 `[1, 3, 6, 10]`이었다. `Gatherer.ofSequential`로 직접 만든 '연속 중복 제거'는 `[1,1,2,2,2,3,1,1]`에서 `[1, 2, 3, 1]`을 냈다.
(실험 확인) Corretto 21.0.13에서 `Gatherers`와 `Stream.gather`는 `cannot find symbol`이었고, Corretto 25.0.4.1에서 `Gatherers.windowFixed(3)`은 `[[1, 2, 3], [4, 5, 6], [7]]`을 출력했다. JDK 22·23의 프리뷰 단계는 해당 JDK가 없어 확인하지 못했다.
