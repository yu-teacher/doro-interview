---
slug: "aop-19"
topic: "aop-proxy"
tier: TRICKY
difficulty: 3
title: "여러 설정에 proxyTargetClass가 다르면 어떻게 되나요?"
keywords: ["통합 auto-proxy creator", "가장 강한 설정 우선", "7.0 확장", "@Proxyable"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/aop/proxying.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/annotation/Proxyable.html"]
---
**모범 답변 (30~60초)**
`@EnableAspectJAutoProxy`, `@EnableTransactionManagement` 같은 설정 애노테이션과 XML의 `<aop:config>`, `<tx:annotation-driven/>`, `<aop:aspectj-autoproxy/>`는 런타임에 하나의 통합 auto-proxy creator로 합쳐지고 가장 강한 설정이 적용됩니다. 그래서 XML에서 하나라도 `proxy-target-class="true"`면 세 요소 모두 CGLIB이 되고, 애노테이션도 `proxyTargetClass` 설정이 합쳐져 가장 강한 값이 적용됩니다. 7.0부터는 `@EnableAsync` 같은 개별 프록시 프로세서도 통합된 전역 기본값에 참여합니다. 특정 빈만 다르게 하고 싶다면 7.0의 `@Proxyable`로 전역 기본값을 재정의할 수 있습니다.

(공식 문서, Proxying Mechanisms) 여러 `<aop:config/>` 섹션은 런타임에 하나의 통합 auto-proxy creator로 합쳐져 가장 강한 프록시 설정을 적용한다. 이는 `<tx:annotation-driven/>`, `<aop:aspectj-autoproxy/>`에도 적용되어 셋 중 하나에 `proxy-target-class="true"`를 쓰면 셋 모두 CGLIB을 강제한다. `@EnableAspectJAutoProxy`, `@EnableTransactionManagement` 등은 대응하는 `proxyTargetClass` 속성이 있고 이것들도 하나의 통합 auto-proxy creator로 합쳐져 가장 강한 설정이 적용된다. 7.0부터는 `@EnableAsync` 같은 개별 프록시 프로세서도 통합 전역 기본값에 일관되게 참여한다. `@Proxyable(INTERFACES)`/`@Proxyable(TARGET_CLASS)`는 `@Bean` 메서드나 `@Component` 클래스에서 전역 기본값을 덮어쓰며, `@Proxyable(interfaces=...)`로 노출할 인터페이스를 제한할 수도 있다.
