---
slug: "ioc-23"
topic: "ioc-di"
tier: DEEP
difficulty: 2
title: "BeanPostProcessor와 BeanFactoryPostProcessor는 무엇이 다른가요?"
keywords: ["빈 정의", "초기화 콜백 전후", "프록시", "static", "자동 프록시"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/beans/factory-extension.html"]
concepts: [bean-lifecycle, ioc-di]
importance: 2
links: [{to: "aop-08", kind: RELATED}]
---
**모범 답변 (30~60초)**
BeanFactoryPostProcessor는 빈 정의, 즉 설정 메타데이터를 읽고 바꾸는 확장점이고, 빈 인스턴스를 만들기 전에 동작합니다. BeanPostProcessor는 이미 만들어진 빈 인스턴스를 다루며, 초기화 콜백 전후에 호출되어 원본을 그대로 돌려주거나 프록시 같은 다른 객체로 바꿔 돌려줄 수 있습니다. 둘 다 `@Bean`으로 등록할 때는 `static` 메서드로 선언하는 것이 좋습니다. 아니면 BeanFactoryPostProcessor는 설정 클래스의 `@Autowired` 같은 애노테이션 처리가 실패할 수 있고, BeanPostProcessor는 설정 클래스와 다른 빈이 일찍 만들어져 후처리 대상에서 빠질 수 있습니다. 또 BeanPostProcessor와 그것이 직접 참조하는 빈은 시작 단계에서 일찍 만들어지기 때문에 자동 프록시 대상에서 빠집니다.

```java
@Configuration
public class AppConfig {
    @Bean
    public static MyBeanPostProcessor myBeanPostProcessor() {
        return new MyBeanPostProcessor();
    }
}
```

(공식 문서) container extension points 페이지에 근거한다. BeanFactoryPostProcessor 안에서 `getBean()`을 호출하면 빈이 너무 일찍 만들어져 컨테이너 생명주기를 어기고 후처리를 건너뛸 수 있다고 경고한다. 둘 다 `Ordered`를 구현할 때만 `order`가 적용되고, 컨테이너 단위로 동작하며, 지연 초기화로 표시해도 무시되고 즉시 인스턴스화된다고 한다. 대표 BeanFactoryPostProcessor로 `PropertySourcesPlaceholderConfigurer`를 든다.
