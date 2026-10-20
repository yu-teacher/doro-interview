---
slug: "pat-23"
topic: "design-pattern"
tier: TRICKY
difficulty: 2
title: "`Integer` 127끼리는 `==`가 true인데 128끼리는 false인 이유는 무엇이고, 이것은 어떤 패턴인가요?"
keywords: ["-128~127 박싱 캐시", "Integer.valueOf", "범위 밖은 보장 없음", "값 비교는 equals", "플라이웨이트"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Integer.html", "https://docs.oracle.com/javase/specs/jls/se25/html/jls-5.html", "https://gameprogrammingpatterns.com/flyweight.html"]
concepts: [type-system, gof-patterns]
importance: 2
links: [{to: "jl-10", kind: RELATED}]
---
**모범 답변 (30~60초)**
`Integer.valueOf(int)`가 -128에서 127까지는 항상 캐시한 같은 인스턴스를 돌려주고, JLS도 이 범위의 상수 박싱은 서로 같은 참조가 되어야 한다고 규정하기 때문입니다. 그래서 127끼리는 `==`가 true이고, 128은 보통 새 객체라 false입니다. 문서는 범위 밖 값도 캐시할 수 있다고 하고 JLS도 그 밖의 값의 동일성에 기대지 말라고 하므로, 값 비교는 `equals`로 해야 합니다. 변하지 않는 공유 가능한 상태를 하나만 두고 재사용해 메모리를 아끼는 것이 플라이웨이트이고, Nystrom은 공유 객체를 대개 불변으로 둔다고 설명합니다.

```java
Integer a1 = 127, a2 = 127, b1 = 128, b2 = 128;
System.out.println(a1 == a2);      // true
System.out.println(b1 == b2);      // false (JDK 25 기본 설정)
System.out.println(b1.equals(b2)); // true
```

(공식 문서) `Integer.valueOf(int)` 문서는 새 인스턴스가 필요 없으면 생성자보다 이 메서드를 쓰라고 하며, 자주 요청되는 값을 캐시해 공간·시간 성능이 낫다고 하고, -128~127은 항상 캐시하며 그 밖의 값도 캐시할 수 있다고 한다. JLS 5.1.7은 상수 표현식을 박싱할 때 -128~127 범위의 정수는 두 박싱 결과가 항상 `a == b`이고, 그 밖의 값에는 동일성에 대한 가정을 허용하지 않는다고 한다.
(원저자 자료) Nystrom, "Flyweight" 장: 플라이웨이트는 객체 데이터를 공유 가능한 내재 상태와 인스턴스별 외재 상태로 나누어 내재 상태 하나를 공유하는 패턴이고, 같은 객체가 여러 곳에서 쓰이므로 대개 불변이라고 설명한다. 문서가 `Integer` 캐시를 플라이웨이트라고 부르지는 않는다.
(실험 확인) JDK 25(Corretto 25.0.3) 기본 설정에서 박싱한 127끼리는 `==` true, 128끼리는 false, `equals`는 true였다. `Integer.valueOf(-128)`끼리는 true, `-129`끼리는 false였다. `-XX:AutoBoxCacheMax=1000`을 주면 128끼리도 `==`가 true였으므로 이 결과를 코드가 가정하면 안 된다.
(보충) `Integer` 캐시를 플라이웨이트라고 보는 것은 위 정의에 비추어 본 해석이다.
