---
slug: "aop-04"
topic: "aop-proxy"
tier: BASIC
difficulty: 1
title: "프록시 패턴과 데코레이터 패턴은 어떻게 다른가요?"
keywords: ["같은 인터페이스", "접근 제어 vs 기능 추가", "의도의 차이"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/aop/introduction-defn.html", "https://docs.spring.io/spring-framework/reference/core/aop/introduction-proxies.html"]
---
**모범 답변 (30~60초)**
둘 다 같은 인터페이스를 구현한 객체가 실제 객체를 감싸는 구조라 모양은 거의 같고, 의도가 다릅니다. 프록시 패턴은 접근 제어가 목적입니다. 지연 생성, 권한 확인, 원격 호출 대리 같은 것입니다. 데코레이터는 기능을 덧붙여 확장하는 것이 목적이고, 여러 겹으로 겹쳐 씁니다. Spring AOP의 프록시는 호출을 가로채 트랜잭션이나 로깅 같은 부가 기능을 붙이는 데 쓰이는데, 클라이언트는 프록시인지 모른 채 같은 타입으로 호출한다는 점에서 이 구조를 활용합니다.

(보충) 프록시 패턴과 데코레이터 패턴의 의도 비교는 GoF 디자인 패턴 일반론이며 Spring 공식 문서에 있는 내용이 아니다.
(공식 문서) Spring AOP 프록시는 JDK 동적 프록시(인터페이스 기반) 또는 CGLIB 프록시이고, 프록시가 해당 메서드에 관련된 모든 인터셉터(advice)에 위임한 뒤 대상 객체를 호출한다.
(실험 확인) 인터페이스를 구현해 대상을 감싸고 시간을 기록하는 프록시를 직접 만들면 클라이언트 코드는 바꾸지 않아도 되고, 부가 기능은 프록시를 거친 호출에만 붙는다.
