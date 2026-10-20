---
slug: "aop-10"
topic: "aop-proxy"
tier: DEEP
difficulty: 2
title: "자기 호출(self-invocation) 문제란? 해결 방법은?"
keywords: ["this 호출", "프록시 우회", "빈 분리(권장)", "self 주입", "AopContext.currentProxy(비권장)", "AspectJ 위빙"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/aop/proxying.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/aop/framework/AopContext.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/annotation/EnableAspectJAutoProxy.html"]
---
**모범 답변 (30~60초)**
프록시를 거쳐 target에 도달한 뒤에 target 내부에서 `this.bar()`를 호출하면, 그 호출은 프록시가 아니라 원본 객체를 직접 부르는 것이라 `bar()`에 걸린 어드바이스가 실행되지 않습니다. 명시적이든 암시적이든 `this`를 통한 자기 호출은 모두 어드바이스를 우회하고, `@Transactional` 메서드를 같은 클래스의 다른 메서드가 부르면 트랜잭션이 안 걸리는 것이 대표 사례입니다. 해결책은 첫째, 구조를 바꿔 호출 대상을 다른 빈으로 분리하는 것이고 문서도 이것을 가장 덜 침습적인 방법으로 꼽습니다. 둘째, 자기 자신(프록시)을 주입받아 호출하는 방법, 셋째 `AopContext.currentProxy()`는 문서가 강하게 비권장합니다. 마지막으로 AspectJ 컴파일·로드 타임 위빙은 프록시가 없으니 문제가 없습니다.

```java
@Service
public class OrderService {
    public void placeOrder() {
        sendNotification();          // this.sendNotification(): 프록시 우회 -> 어드바이스 없음
    }
    @Transactional
    public void sendNotification() { }
}
// 해결: sendNotification()을 별도 NotificationService 빈으로 분리하고 주입받아 호출
```

(공식 문서, Proxying Mechanisms) 위 세 가지 대응(리팩터링으로 자기 호출 제거가 최선, self 참조 주입, 최후 수단으로 `AopContext.currentProxy()`)과 AspectJ 위빙이 서술되어 있다. `AopContext.currentProxy()`는 코드를 Spring AOP에 완전히 결합시키는 "highly discouraged" 방법이며 프록시를 노출하도록 설정(`ProxyFactory.setExposeProxy(true)`, `@EnableAspectJAutoProxy(exposeProxy = true)`)해야 한다. Javadoc: 프록시는 기본으로 노출되지 않으며(성능 비용), 노출 설정이 없으면 `IllegalStateException`이 난다.
(실험 확인) `inner()`에 걸린 Before 어드바이스는 `outer()`가 `this.inner()`로 호출하면 실행되지 않고, 프록시 밖에서 `inner()`를 직접 호출하면 실행된다. 대상이 `ObjectProvider`로 자기 자신(프록시)을 조회해 `inner()`를 호출하면 내부 호출에도 어드바이스가 실행된다. 또 트랜잭션이 없는 메서드가 `this`로 `@Transactional` 메서드를 호출하면, 그 메서드가 예외를 던져도 저장한 행이 롤백되지 않고 남는다. 프록시를 거친 `@Transactional` 호출은 같은 예외에서 전부 롤백된다.
