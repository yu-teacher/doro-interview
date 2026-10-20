---
slug: "aop-10"
topic: "aop-proxy"
tier: DEEP
difficulty: 2
title: "자기 호출(self-invocation) 문제란? 해결 방법은?"
keywords: ["this 호출", "프록시 우회", "빈 분리(권장)", "self 주입", "AopContext.currentProxy(비권장)", "AspectJ 위빙"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
프록시를 거쳐 target에 도달한 뒤에 target 내부에서 `this.bar()`를 호출하면, 그 호출은 프록시가 아니라 원본 객체를 직접 부르는 것이라 `bar()`에 걸린 어드바이스가 실행되지 않습니다. `@Transactional` 메서드를 같은 클래스의 다른 메서드가 부르면 트랜잭션이 안 걸리는 것이 대표 사례입니다. 해결책은 첫째, 구조를 바꿔 호출 대상을 다른 빈으로 분리하는 것이고 문서도 이것을 선호합니다. 둘째, 자기 자신(프록시)을 주입받아 호출하는 방법, 셋째 `AopContext.currentProxy()`는 문서가 강하게 비권장합니다. 마지막으로 AspectJ 위빙을 쓰면 프록시가 없으니 문제가 없습니다.

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

- 공식 문서(Proxying Mechanisms): 위 세 가지 대응(리팩터링, self 참조 주입, `AopContext.currentProxy()`는 `setExposeProxy(true)` 필요하며 "highly discouraged")과 AspectJ 위빙.
- 실험: TxExperimentTest `자기호출은_프록시를_거치지_않아_트랜잭션이_적용되지_않는다()`는 `experiment.selfInvocation(email)`이 `IllegalStateException`을 던져도 `countByEmail(email)`이 1이라는 것을 단언한다. 즉 롤백되지 않았다. 반면 `트랜잭션_안에서_예외가_나면_전부_롤백된다()`는 프록시를 직접 거친 호출에서 0건으로 롤백됨을 대조군으로 보여준다.
