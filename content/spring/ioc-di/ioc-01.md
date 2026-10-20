---
slug: "ioc-01"
topic: "ioc-di"
tier: BASIC
difficulty: 1
title: "IoC와 DI는 무엇이고, 어떤 관계인가요?"
keywords: ["제어의 역전", "컨테이너가 생성/연결", "DI는 IoC의 특수한 형태", "서비스 로케이터와 대비", "느슨한 결합"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-collaborators.html", "https://docs.spring.io/spring-framework/reference/core/beans/introduction.html"]
concepts: [ioc-di, solid-principles]
importance: 3
links: [{to: "ioc-02", kind: FOLLOWUP}, {to: "ioc-09", kind: FOLLOWUP}, {to: "arc-14", kind: RELATED}, {to: "arc-06", kind: RELATED}]
---
**모범 답변 (30~60초)**
IoC는 객체의 생성과 의존 관계 연결의 제어권이 개발자 코드에서 컨테이너로 넘어가는 것을 말합니다. 원래는 객체가 의존 객체를 직접 생성하거나 서비스 로케이터 같은 방식으로 직접 찾아 오는데, IoC에서는 컨테이너가 빈을 만들고 필요한 것을 넣어 줍니다. DI는 이 IoC의 특수한 형태로, 객체는 생성자 인자, 팩토리 메서드 인자, 생성 후 설정되는 프로퍼티로만 자기 의존성을 선언하고 컨테이너가 주입합니다. 그래서 객체는 의존 객체의 위치나 구현 클래스를 알 필요가 없고, 구현체 교체와 테스트 대역 주입이 쉬워져 결합도가 낮아집니다.

- (공식 문서) DI는 IoC의 특수한 형태(specialized form)이며, 객체가 의존성을 직접 생성하거나 서비스 로케이터로 조회하는 것의 반대 방향(inverse)이라 IoC라는 이름이 붙었다. 객체가 의존성을 생성자/팩토리 메서드 인자/프로퍼티로만 선언하면 컨테이너가 주입한다.
- (공식 문서) 의존성의 위치나 클래스를 객체가 알지 못하므로 인터페이스나 추상 클래스에 의존할 때 stub·mock 구현으로 단위 테스트하기 쉬워진다.
- (보충) "IoC = DI"로 뭉뚱그려 답하기보다 "IoC는 큰 개념, DI는 그 구현 방식 중 하나(서비스 로케이터 등 다른 방식도 가능)"라고 구분하면 정확하다.
