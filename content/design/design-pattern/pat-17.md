---
slug: "pat-17"
topic: "design-pattern"
tier: DEEP
difficulty: 2
title: "옵저버 패턴의 단점은 무엇이고, `java.util.Observable`은 왜 deprecated 되었나요?"
keywords: ["동기 호출로 주체 블로킹", "lapsed listener 메모리 누수", "등록 해제 규율", "런타임에야 알 수 있는 호출 흐름", "Flow API"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://gameprogrammingpatterns.com/observer.html", "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/Observable.html", "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/Observer.html", "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/Flow.html"]
---
**모범 답변 (30~60초)**
Nystrom은 몇 가지를 짚습니다. 옵저버는 동기 호출이라 느린 옵저버가 주체를 막을 수 있고, 주체가 옵저버 참조를 쥐고 있어서 등록 해제를 잊으면 화면이 닫혀도 가비지 컬렉션이 안 되는 lapsed listener 문제가 생깁니다. 또 누가 알림을 받는지는 런타임 목록을 봐야 알 수 있어 흐름 추적이 어렵습니다. 그는 양쪽을 함께 이해해야 하는 관계에는 더 명시적인 방법을 쓰라고 조언합니다. JDK 문서는 `Observable`이 deprecated된 이유로 제한적인 이벤트 모델, 불명확한 알림 순서, 상태 변경과 알림이 일대일이 아닌 점을 들고 `Flow` 같은 대안을 안내합니다.

```java
Consumer<Integer> listener = screen::show;
hero.register(listener);
// screen 참조를 버려도 listener 가 Screen 을 붙들고 있다 -> GC 안 됨
hero.unregister(listener);   // 해제 후에야 수거 가능
```

(원저자 자료) Nystrom, "Observer" 장: 주체가 옵저버를 동기로 호출하므로 느린 옵저버가 주체를 막고 락과 섞이면 교착이 날 수 있다고 하고, 가비지 컬렉터가 있어도 등록 해제를 하지 않으면 옵저버가 주체의 목록에 남아 수거되지 않는 lapsed listener 문제가 있다고 한다. 또 통신 흐름을 정적으로 추적하기 어려워지므로, 양쪽을 함께 생각해야 이해되는 관계는 Observer로 표현하지 말고 더 명시적인 방법을 쓰라는 것이 저자의 지침이다. 이것은 저자의 주장이다.
(공식 문서) `Observable` API 문서(Java 9부터 deprecated)는 이벤트 모델이 제한적이고 알림 순서가 정해져 있지 않으며 상태 변경과 알림이 일대일이 아니라고 하고, 더 풍부한 이벤트 모델은 `java.beans`, 스레드 간 신뢰할 수 있는 메시징은 `java.util.concurrent`, 리액티브 스트림 방식은 `Flow` API를 보라고 한다. `Flow` 문서는 발행자가 구독자에게 비동기로 항목을 발행하며 `request(long)`으로 흐름 제어를 한다고 한다.
(실험 확인) 직접 만든 옵저버 구현에서 `Screen`을 `WeakReference`로 감시하며 참조를 버리고 `System.gc()`를 반복했다. 리스너가 등록된 동안에는 수거되지 않았고, `unregister` 후에는 수거되었다(JVM이 gc 요청을 받아들인 결과이므로 보장되는 동작은 아니다). `SubmissionPublisher` 예에서는 구독자가 호출자와 다른 스레드에서 항목을 받았다.
