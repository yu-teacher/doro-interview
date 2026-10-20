---
slug: "aop-06"
topic: "aop-proxy"
tier: BASIC
difficulty: 1
title: "JDK 동적 프록시와 CGLIB 프록시의 차이는? Spring Boot의 기본은?"
keywords: ["JDK 동적 프록시(인터페이스)", "CGLIB(상속)", "proxyTargetClass", "Boot 기본 CGLIB", "`@Proxyable`(7.0+)"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
JDK 동적 프록시는 JDK 내장 기능으로 인터페이스를 구현한 프록시를 만들고, CGLIB은 대상 클래스를 상속한 서브클래스를 런타임에 생성합니다. Spring Framework의 기본 규칙은, 대상이 인터페이스를 하나라도 구현하면 JDK 프록시, 아니면 CGLIB입니다. `proxyTargetClass=true`로 CGLIB을 강제할 수 있습니다. 문서상 Spring Boot는 설정에 따라 클래스 기반 프록시를 기본으로 쓸 수 있다고 되어 있고, 우리 프로젝트 테스트에서도 서비스가 CGLIB 프록시임을 확인했습니다.

```java
// 공식 문서: 인터페이스 유무와 관계없이 클래스 프록시 강제
@EnableAspectJAutoProxy(proxyTargetClass = true)

// 7.0부터: 빈 단위로 지정
@Proxyable(TARGET_CLASS)   // 또는 INTERFACES
@Component
public class OrderService implements OrderApi { }
```

- 공식 문서(Proxying Mechanisms): 인터페이스 구현 시 JDK, 없으면 CGLIB. `proxyTargetClass` 속성은 `@EnableAspectJAutoProxy`, `@EnableTransactionManagement` 등에도 있고, 셋 중 하나만 true여도 통합 auto-proxy creator가 가장 강한 설정을 적용한다. 7.0부터 `@EnableAsync` 같은 개별 프록시 프로세서까지 통합된다. 코어 프레임워크는 인터페이스 기반을 선호하고 Boot는 설정에 따라 클래스 기반이 기본일 수 있다고 서술한다.
- (보충) Boot 쪽 구체 프로퍼티는 `spring.aop.proxy-target-class` (기본 true)로 알고 있으나, 이번에 읽은 문서에서는 프로퍼티 이름과 기본값을 확인하지 못했다.
- 실험: TxExperimentTest `서비스는_CGLIB_프록시다()`가 `AopUtils.isCglibProxy(experiment)`로 검증하고 클래스명을 출력한다 (`[proxy] ...`).
