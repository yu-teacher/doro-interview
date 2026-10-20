---
slug: "ioc-13"
topic: "ioc-di"
tier: DEEP
difficulty: 2
title: "prototype 빈의 생명주기는 싱글톤과 어떻게 다른가요?"
keywords: ["초기화 O", "소멸 콜백 X", "new 대체", "정리는 클라이언트 책임"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/beans/factory-scopes.html"]
---
**모범 답변 (30~60초)**
prototype은 컨테이너가 생성, 의존성 주입, 초기화 콜백까지만 수행하고 클라이언트에게 넘기면 더 이상 추적하지 않습니다. 그래서 초기화 콜백은 매번 호출되지만 소멸 콜백(@PreDestroy 등)은 호출되지 않아 자원 해제는 클라이언트 책임입니다. 싱글톤은 컨테이너가 끝까지 관리해 컨텍스트를 닫을 때 소멸 콜백까지 호출하지만, prototype은 그렇지 않습니다. 컨테이너는 prototype에 대해 사실상 new 연산자를 대체하는 역할을 하고, 컨테이너가 자원을 해제하게 하려면 정리할 빈을 참조로 들고 있는 커스텀 BeanPostProcessor가 필요합니다.

- (공식 문서) 위 내용 전부. 컨테이너가 prototype이 쥔 자원을 해제하게 하려면 해제할 빈을 참조로 들고 있는 커스텀 BeanPostProcessor를 써 보라고 문서에 나와 있다.
- (실험 확인) 싱글톤은 컨텍스트를 닫을 때 소멸 콜백이 호출되지만 prototype 빈은 호출되지 않는다.
