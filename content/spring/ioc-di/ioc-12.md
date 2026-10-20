---
slug: "ioc-12"
topic: "ioc-di"
tier: DEEP
difficulty: 2
title: "@Configuration은 왜 CGLIB 프록시로 감싸지나요? proxyBeanMethods는 무엇인가요?"
keywords: ["CGLIB 서브클래스", "@Bean 호출 가로채기", "full vs lite", "proxyBeanMethods=false", "파라미터 주입", "final/private 불가"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
@Configuration 클래스에서 한 @Bean 메서드가 다른 @Bean 메서드를 호출하면, 자바 관점에서는 매번 새로 생성하는 것처럼 보입니다. 이를 막기 위해 스프링은 시작 시 설정 클래스를 CGLIB로 상속한 서브클래스를 만들어, @Bean 메서드 호출을 가로채서 컨테이너에 이미 빈이 있으면 그것을 반환합니다. 그래서 싱글톤이 보장됩니다. 이것이 full 모드입니다. @Configuration(proxyBeanMethods = false)로 끄면 CGLIB 강화가 없어 lite 모드로 동작하고, 메서드 간 직접 호출은 새 인스턴스를 만듭니다. 이때는 의존성을 메서드 파라미터로 받아야 합니다. 대신 시작이 가볍고 런타임 오버헤드가 적습니다. 강화를 위해 설정 클래스와 @Bean 메서드는 final이면 안 됩니다.

- (공식 문서) CGLIB 서브클래싱, 싱글톤 캐싱은 싱글톤에 해당, `proxyBeanMethods=false` 시 inter-bean 호출이 가로채이지 않아 파라미터 주입 필요, 설정 클래스는 final 불가, CGLIB는 `spring-core`에 repackage되어 포함되어 있다는 내용. lite 모드는 오버헤드가 낮다는 비교도 문서에 있다.
- (보충) GraalVM 네이티브 이미지/AOT에서 proxyBeanMethods=false가 유리하다는 이야기는 일반적으로 알려진 내용이나, 이번에 읽은 페이지에서 직접 확인한 것은 아니다.

```java
@Configuration(proxyBeanMethods = false)
class AppConfig {
    @Bean BeanTwo beanTwo() { return new BeanTwo(); }
    @Bean BeanOne beanOne(BeanTwo beanTwo) {     // 호출 대신 파라미터로 받음
        return new BeanOne(beanTwo);
    }
}
```
