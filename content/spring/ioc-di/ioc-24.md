---
slug: "ioc-24"
topic: "ioc-di"
tier: DEEP
difficulty: 2
title: "FactoryBean은 무엇이고, getBean에 &를 붙이는 이유는 무엇인가요?"
keywords: ["FactoryBean", "getObject", "getObjectType", "isSingleton", "& 접두사"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/beans/factory-extension.html"]
---
**모범 답변 (30~60초)**
FactoryBean은 컨테이너의 인스턴스 생성 로직에 직접 끼어드는 확장점입니다. 생성 과정이 복잡해서 설정 메타데이터보다 자바 코드로 쓰는 편이 나을 때, 그 로직을 팩토리 클래스에 구현하고 팩토리를 빈으로 등록합니다. `getObject()`가 실제로 쓰일 객체를 반환하고, `getObjectType()`은 그 타입을, `isSingleton()`은 싱글톤 여부를 알려 주며 기본 구현은 true입니다. 헷갈리는 지점은 조회입니다. 팩토리의 id가 `myBean`일 때 `getBean("myBean")`은 팩토리가 만든 결과물을 주고, 팩토리 자신을 얻으려면 & 접두사를 붙여 `getBean("&myBean")`으로 요청합니다. Spring 자체에도 50개가 넘는 구현이 들어 있습니다.

```java
Object product = ctx.getBean("myBean");    // getObject()의 결과
Object factory = ctx.getBean("&myBean");   // FactoryBean 인스턴스 자체
```

(공식 문서) container extension points 페이지의 FactoryBean 절에 근거한다. `getObjectType()`은 타입을 미리 알 수 없으면 null을 반환할 수 있다.
