---
slug: "ioc-23"
topic: "ioc-di"
tier: DEEP
difficulty: 2
title: "BeanPostProcessor와 BeanFactoryPostProcessor는 무엇이 다른가요?"
keywords: ["빈 정의", "초기화 콜백 전후", "프록시", "static", "자동 프록시"]
has_extra: false
status: DRAFT
sources: ["https://docs.spring.io/spring-framework/reference/core/beans/factory-extension.html"]
---
**모범 답변 (30~60초)**
BeanFactoryPostProcessor는 빈 정의, 즉 설정 메타데이터를 읽고 바꾸는 확장점이고, 빈 인스턴스를 만들기 전에 동작합니다. BeanPostProcessor는 이미 만들어진 빈 인스턴스를 다루며, 초기화 콜백 전후에 호출되어 원본을 그대로 돌려주거나 프록시 같은 다른 객체로 바꿔 돌려줄 수 있습니다. 그래서 정의를 바꾸려면 전자를, 인스턴스를 가공하려면 후자를 씁니다. 둘 다 `@Bean`으로 등록할 때는 `static` 메서드로 선언하는 것이 좋습니다. 아니면 선언한 설정 클래스가 너무 일찍 초기화되어 `@Autowired` 같은 처리가 안 될 수 있습니다. 또 BeanPostProcessor와 그것이 직접 참조하는 빈은 일찍 만들어지기 때문에 자동 프록시 대상에서 빠집니다.

```java
@Configuration
public class AppConfig {
    @Bean
    public static MyBeanPostProcessor myBeanPostProcessor() {
        return new MyBeanPostProcessor();
    }
}
```

(공식 문서) container extension points 페이지에 근거한다. BeanFactoryPostProcessor 안에서 `getBean()`을 호출하면 빈이 너무 일찍 만들어져 컨테이너 생명주기를 어기고 후처리를 건너뛸 수 있다고 경고한다. 둘 다 `Ordered`를 구현할 때만 `order`가 적용되고, 컨테이너 단위로 동작하며 지연 초기화로 설정하지 말라고 한다. 대표 BeanFactoryPostProcessor로 `PropertySourcesPlaceholderConfigurer`를 든다.
