---
slug: "jvr-04"
topic: "java-versions"
tier: BASIC
difficulty: 1
title: "switch 식(Java 14)은 기존 switch 문과 무엇이 다른가요?"
keywords: ["값을 만드는 switch 식", "화살표 레이블은 fall-through 없음", "yield로 값 반환", "모든 경우를 덮어야 함", "여러 상수를 한 case에"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://openjdk.org/jeps/361"]
concepts: [modern-java]
importance: 2
links: [{to: "jvr-10", kind: FOLLOWUP}, {to: "jo-12", kind: RELATED}]
---
**모범 답변 (30~60초)**
Java 14에서 정식이 된 switch 식은 switch가 값을 만들어 내게 한 기능입니다. `case X ->` 화살표 형태는 해당 가지만 실행되고 아래로 흘러내리는 fall-through가 없어서 `break`를 빠뜨리는 실수가 사라집니다. 한 가지에 `case SAT, SUN ->`처럼 상수를 여러 개 쓸 수 있고, 가지가 여러 문장이면 블록 안에서 `yield`로 값을 돌려줍니다. 또 switch 식은 가능한 모든 값을 덮어야 해서, enum에 상수를 빼먹으면 컴파일 오류가 납니다. 기존 `case X:` 형태도 식에서 쓸 수 있지만 그때는 fall-through가 유지됩니다.

```java
int n = switch (day) {
    case MON -> 1;
    case TUE -> 2;
    case SAT, SUN -> { int t = 5; yield t * 2; }
};
```

(공식 문서) JEP 361은 switch를 문과 식 양쪽으로 쓰게 하고, 기존 `case ... :` 레이블(fall-through 있음)과 새 `case ... ->` 레이블(fall-through 없음)을 모두 두며, 값을 내보내는 `yield` 문을 새로 둔다고 한다. 식의 case는 exhaustive해야 하고, JDK 12·13의 프리뷰를 거쳐 Release 14에 정식으로 들어왔다고 한다.
(실험 확인) 위 코드(enum Day: MON, TUE, SAT, SUN)는 javac 25에서 컴파일되어 `neu(MON)=1`, `neu(SUN)=10`이었다. 같은 값을 `case MON:` 방식의 switch 문으로 쓰되 MON 가지에 `break`를 빼면 TUE 가지까지 실행되어 누적 결과가 3이었다. `case SAT, SUN` 가지를 지우면 `the switch expression does not cover all possible input values` 오류였다.
(실험 확인) Corretto 8.512와 11.0.33에서는 같은 switch 식 코드가 `illegal start of expression`으로 컴파일되지 않았고, 17.0.21·21.0.13·25.0.4.1에서는 컴파일되어 `1 10`을 출력했다. `case SAT, SUN` 가지를 뺀 변형은 17.0.21·21·25 모두 `the switch expression does not cover all possible input values` 오류였다.
