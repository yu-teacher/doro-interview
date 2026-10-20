---
slug: "pat-05"
topic: "design-pattern"
tier: TRICKY
difficulty: 2
title: "`FactoryBean` 구현체를 빈으로 등록하고 `getBean`으로 꺼내면 왜 `FactoryBean`이 아니라 다른 객체가 나오나요?"
keywords: ["FactoryBean은 객체를 만드는 빈", "getObject 결과가 노출됨", "& 접두사로 팩토리 자체 조회", "생명주기는 FactoryBean만 관리", "DisposableBean으로 정리"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/FactoryBean.html", "https://docs.spring.io/spring-framework/reference/core/beans/factory-extension.html"]
concepts: [gof-patterns, ioc-di]
importance: 1
links: [{to: "ioc-24", kind: RELATED}]
---
**모범 답변 (30~60초)**
`FactoryBean`은 그 자체가 빈 인스턴스로 노출되는 것이 아니라, 다른 객체를 만들어 내는 팩토리 역할을 하는 빈이기 때문입니다. 이 빈 이름으로 요청하면 컨테이너는 `getObject()`가 돌려주는 객체를 줍니다. `FactoryBean` 자신이 필요하면 이름 앞에 `&`를 붙여 `getBean("&myBean")`으로 꺼냅니다. 컨테이너는 `FactoryBean` 인스턴스의 생명주기만 관리하고 만들어진 객체의 소멸까지 책임지지 않으므로, 닫아야 하는 자원은 `DisposableBean`으로 직접 정리해야 합니다.

(공식 문서) `FactoryBean` API 문서는 이 인터페이스를 구현한 빈은 그 자체가 아니라 노출할 객체의 팩토리로 쓰이며, 빈 참조로 노출되는 것은 항상 `getObject()`가 만든 객체라고 한다. 컨테이너는 `FactoryBean` 인스턴스의 생명주기만 관리하므로 노출된 객체의 `Closeable.close()` 같은 소멸 메서드는 자동 호출되지 않아 `DisposableBean`으로 위임해야 한다고 한다. 싱글톤과 프로토타입을 모두 지원하고 지연·즉시 생성이 가능하며, 주로 프레임워크 인프라 코드에서 쓰인다고 한다. Factory Extension 페이지는 `getObject`, `isSingleton`, `getObjectType` 세 메서드를 소개하고, 스프링 자체에 50개가 넘는 구현이 있으며, `getBean("myBean")`은 생성된 객체를, `getBean("&myBean")`은 `FactoryBean` 인스턴스를 돌려준다고 한다.
스프링 동작이므로 코드로 실행하지 않고 문서 근거로만 적었다.
