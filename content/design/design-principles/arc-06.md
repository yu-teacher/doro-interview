---
slug: "arc-06"
topic: "design-principles"
tier: DEEP
difficulty: 2
title: "의존성 역전 원칙(DIP)에서 '역전'되는 것은 무엇인가요? 제어 흐름과 소스 의존 방향으로 설명해 주세요."
keywords: ["추상화 쪽으로 의존", "소스 코드 의존 방향의 역전", "제어 흐름과 반대", "안쪽에 둔 인터페이스"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://blog.cleancoder.com/uncle-bob/2020/10/18/Solid-Relevance.html", "https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html", "http://butunclebob.com/ArticleS.UncleBob.PrinciplesOfOod"]
concepts: [solid-principles, ioc-di]
importance: 3
links: [{to: "arc-08", kind: FOLLOWUP}, {to: "arc-14", kind: FOLLOWUP}, {to: "ioc-01", kind: RELATED}]
---
**모범 답변 (30~60초)**
DIP는 고수준 모듈이 저수준 세부에 의존하지 말고 추상화 쪽으로 의존하라는 원칙입니다. 역전되는 것은 소스 코드 의존의 방향입니다. 제어 흐름은 컨트롤러에서 유스케이스를 거쳐 프레젠터를 호출하는 쪽으로 흐르지만, 유스케이스가 안쪽에 인터페이스를 두고 바깥 구현체가 그것을 구현하면 소스 코드 의존은 바깥에서 안쪽으로 향합니다. Robert Martin은 아키텍처 경계를 넘는 의존성이 고수준 추상화를 향하게 해서, SQL이나 서식 같은 세부가 돈을 버는 계산 로직을 오염시키지 않게 하라고 설명합니다.

```java
interface OrderOutputPort { void present(String text); }        // 안쪽(유스케이스 쪽)에 둔 포트
class PlaceOrderUseCase { PlaceOrderUseCase(OrderOutputPort out) { ... } }
class ConsolePresenter implements OrderOutputPort { ... }       // 바깥이 안쪽 인터페이스를 구현
```

(원저자 자료) Robert C. Martin, "Solid Relevance"(2020-10-18)는 DIP를 '추상화 방향으로 의존하라, 고수준 모듈은 저수준 세부에 의존하면 안 된다'로 적고, 모든 소스 코드 의존, 특히 아키텍처 경계를 넘는 것이 고수준 추상화를 향해야 한다고 설명한다. "The Principles of OOD"는 한 줄 정의로 '구체가 아닌 추상에 의존하라'를 적는다.
(원저자 자료) 같은 저자의 "The Clean Architecture"(2012-08-13) 'Crossing boundaries' 절은 제어 흐름이 컨트롤러에서 유스케이스를 거쳐 프레젠터로 흐르는데 소스 의존은 모두 유스케이스를 향한다고 하고, 이 모순을 DIP로 푼다고 한다. 유스케이스가 안쪽의 Use Case Output Port 인터페이스를 호출하고 바깥의 프레젠터가 구현하는 방식이다.
(실험 확인) JDK 25 `java Dip.java`에서 `PlaceOrderUseCase`의 필드 타입을 리플렉션으로 확인하니 `OrderOutputPort` 인터페이스였고, `ConsolePresenter`는 그 인터페이스를 구현했으며 실행하면 유스케이스가 프레젠터를 호출했다. 이 예는 구조의 한 사례일 뿐이다.
