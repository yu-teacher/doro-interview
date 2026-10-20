---
slug: "ioc-13"
topic: "ioc-di"
tier: DEEP
difficulty: 2
title: "prototype 빈의 생명주기는 싱글톤과 어떻게 다른가요?"
keywords: ["초기화 O", "소멸 콜백 X", "new 대체", "정리는 클라이언트 책임"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
prototype은 컨테이너가 생성, 의존성 주입, 초기화 콜백까지만 수행하고 클라이언트에게 넘기면 더 이상 추적하지 않습니다. 그래서 초기화 콜백은 매번 호출되지만 소멸 콜백(@PreDestroy 등)은 호출되지 않아 자원 해제는 클라이언트 책임입니다. 컨테이너는 prototype에 대해 사실상 new 연산자를 대체하는 역할을 합니다.

- (공식 문서) 위 내용 전부. 컨테이너가 prototype 자원을 해제하게 하려면 커스텀 BeanPostProcessor가 필요하다고 문서에 나와 있다.
