---
slug: "ioc-08"
topic: "ioc-di"
tier: BASIC
difficulty: 1
title: "빈의 생명주기를 순서대로 설명해 주세요."
keywords: ["생성 -> DI -> 초기화 콜백 -> 사용 -> 소멸 콜백", "@PostConstruct -> afterPropertiesSet -> initMethod", "@PreDestroy -> destroy -> destroyMethod", "종료 훅"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/beans/factory-nature.html"]
---
**모범 답변 (30~60초)**
컨테이너가 빈 정의를 바탕으로 인스턴스를 생성하고, 의존성을 주입한 뒤, 초기화 콜백을 호출합니다. 초기화 콜백은 @PostConstruct, InitializingBean의 afterPropertiesSet, 설정한 커스텀 init 메서드 순서입니다. 이후 빈은 사용 가능 상태가 되고, 컨테이너가 종료될 때 소멸 콜백이 같은 순서로 @PreDestroy, DisposableBean의 destroy, 커스텀 destroy 메서드 순으로 호출됩니다. 스프링 API에 결합되지 않는 @PostConstruct/@PreDestroy를 쓰는 것이 권장됩니다. 비웹 애플리케이션은 종료 훅을 등록해야 소멸 콜백이 실행됩니다.

- (공식 문서) 콜백 3종과 호출 순서, 같은 이름의 메서드를 여러 방식으로 설정하면 한 번만 실행되는 점, `@Bean`의 destroy 메서드를 public `close`/`shutdown`으로 자동 추론하는 점(AutoCloseable·Closeable 구현체 포함), 비웹 앱은 `registerShutdownHook()`이 필요한 점(웹 기반 ApplicationContext는 이미 정상 종료 코드가 있다), 초기화 콜백은 AOP 프록시가 적용되기 전 원본 빈에서 호출되는 점 모두 문서 내용이다.
- (실험 확인) 한 빈에 `@PostConstruct`, `InitializingBean`, `initMethod`와 `@PreDestroy`, `DisposableBean`, `destroyMethod`를 모두 설정하면 위 순서대로 호출되고, 소멸 콜백은 컨텍스트를 닫을 때 호출된다. 싱글톤은 컨텍스트 refresh 시점에 미리 생성되어 초기화된다.

```java
public class OrderService implements InitializingBean, DisposableBean {
    @PostConstruct  void a() {}            // 1
    @Override public void afterPropertiesSet() {}  // 2
    void init() {}                          // 3 (@Bean(initMethod="init"))
    @PreDestroy     void b() {}             // 1
    @Override public void destroy() {}      // 2
    void cleanup() {}                       // 3 (@Bean(destroyMethod="cleanup"))
}
```
