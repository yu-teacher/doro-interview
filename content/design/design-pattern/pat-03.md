---
slug: "pat-03"
topic: "design-pattern"
tier: DEEP
difficulty: 2
title: "자바에서 스레드 안전한 싱글톤은 어떻게 구현하나요? 단순한 지연 초기화는 무엇이 문제인가요?"
keywords: ["지연 초기화 경쟁 상태", "클래스 초기화 락", "holder 클래스", "enum 싱글톤", "리플렉션 방어"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.oracle.com/javase/specs/jls/se25/html/jls-12.html", "https://docs.oracle.com/javase/specs/jls/se25/html/jls-8.html"]
---
**모범 답변 (30~60초)**
`if (inst == null) inst = new ...` 식의 지연 초기화는 경쟁 상태가 생겨 여러 스레드가 동시에 null을 보고 각자 인스턴스를 만들 수 있으므로 안전하지 않습니다. 지연이 필요 없으면 `static final` 필드에서 바로 만들면 되고, 지연이 필요하면 중첩 holder 클래스에 인스턴스를 두는 방법이 있습니다. JLS는 클래스 초기화를 클래스별 락으로 동기화하고, 정적 메서드 호출 같은 첫 사용 직전에 초기화한다고 하므로 holder는 처음 쓰일 때 한 번만 만들어집니다. enum 하나짜리 싱글톤은 리플렉션 생성과 `clone`까지 언어가 막아 줍니다.

```java
class Holder {
    private Holder() {}
    private static class H { static final Holder I = new Holder(); }
    static Holder get() { return H.I; }   // H 는 get() 이 처음 불릴 때 초기화된다
}
enum EnumSingleton { INSTANCE }
```

(공식 문서) JLS 12.4.1은 정적 메서드가 호출되거나 상수가 아닌 정적 필드가 쓰이기 직전에 클래스가 초기화된다고 하고, 12.4.2는 클래스마다 고유한 초기화 락을 두어 다른 스레드가 초기화 중이면 기다리게 하는 절차를 기술한다. JLS 8.9는 enum 클래스에는 enum 상수 말고 인스턴스가 없으며 `Enum`의 `clone`이 `final`이라 복제할 수 없고 리플렉션 생성도 금지된다고 한다.
(실험 확인) 8개 스레드를 래치로 동시에 출발시켜 `get()`을 호출했다. 생성자에 50ms 지연을 넣어 경쟁을 유도한 단순 지연 초기화는 서로 다른 인스턴스 8개(생성자 8회)가 만들어졌고, holder 방식과 enum 방식은 각각 1개였다. 지연은 경쟁이 잘 드러나게 한 인위적 장치다. enum의 생성자를 리플렉션으로 호출하면 `IllegalArgumentException: Cannot reflectively create enum objects`가 났고, `private` 생성자 holder는 `setAccessible(true)`로 두 번째 인스턴스를 만들 수 있었다(Corretto 25.0.3).
(보충) holder 클래스 관용구라는 이름과 형태는 JLS에 없고, 위 초기화 규칙에서 따져 본 일반적 설명이다.
