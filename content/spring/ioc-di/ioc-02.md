---
slug: "ioc-02"
topic: "ioc-di"
tier: BASIC
difficulty: 1
title: "생성자 주입이 필드/세터 주입보다 권장되는 이유는 무엇인가요?"
keywords: ["불변성(final)", "null 방지", "완전히 초기화된 객체", "필수/선택 구분", "책임 과다 신호", "테스트 용이성"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-collaborators.html"]
concepts: [ioc-di, immutability]
importance: 3
links: [{to: "ioc-03", kind: FOLLOWUP}, {to: "ioc-15", kind: FOLLOWUP}, {to: "tst-20", kind: RELATED}]
---
**모범 답변 (30~60초)**
공식 문서가 필수 의존성에는 생성자 주입, 선택적 의존성에는 세터 주입을 권하고, Spring 팀도 대체로 생성자 주입을 선호한다고 밝힙니다. 이유는 첫째 필드를 final로 두어 불변 객체를 만들 수 있고, 둘째 필수 의존성이 null이 아님이 보장되며, 셋째 생성이 끝난 시점에 항상 완전히 초기화된 객체가 호출자에게 전달되기 때문입니다. 또 생성자 인자가 너무 많아지면 클래스 책임이 과하다는 신호로 읽을 수 있습니다. 필드 주입은 final을 쓸 수 없고, 스프링 없이 new 하면 의존성이 null이라 단위 테스트에서 리플렉션으로 넣어야 해서 불편합니다.

- (공식 문서) 위 세 가지 이점과 "생성자 인자가 많으면 코드 냄새"라는 언급은 의존성 주입 페이지 내용이다. 세터 주입은 클래스 안에 합리적 기본값이 있는 선택 의존성에 쓰고, 그렇지 않으면 사용처마다 null 검사가 필요하다고 한다. 세터는 재설정·재주입에 적합해 JMX 관리가 대표 사례다. 소스가 없는 서드파티 클래스는 세터가 없으면 생성자 주입이 유일한 선택일 수 있다고도 한다.
- (실험 확인) 컨테이너 없이 생성자 주입 클래스는 `new`로 가짜 의존성을 바로 넣어 테스트할 수 있고, 필드 주입 클래스는 `new` 직후 필드가 null이라 사용하면 `NullPointerException`이 난다. 생성자 주입 필드는 final로 선언할 수 있다.

```java
@Service
public class OrderService {
    private final OrderRepository orderRepository;   // final: 불변, null 아님

    public OrderService(OrderRepository orderRepository) {   // 생성자가 하나뿐이면 @Autowired 생략 가능
        this.orderRepository = orderRepository;
    }
}
// 단위 테스트: new OrderService(fakeRepository)  -- 스프링 컨테이너 불필요
```
