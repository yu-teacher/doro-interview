---
slug: "aop-19"
topic: "aop-proxy"
tier: TRICKY
difficulty: 3
title: "여러 설정에 proxyTargetClass가 다르면 어떻게 되나요?"
keywords: ["통합 auto-proxy creator", "가장 강한 설정 우선", "7.0 확장", "@Proxyable"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
`@EnableAspectJAutoProxy`, `@EnableTransactionManagement`, `<aop:config>`는 런타임에 하나의 통합 auto-proxy creator로 합쳐지고 가장 강한 설정이 적용됩니다. 그래서 하나라도 `proxyTargetClass=true`면 셋 모두 CGLIB이 됩니다. 7.0부터는 `@EnableAsync` 같은 개별 프록시 프로세서에도 이 통합이 확장됩니다. 특정 빈만 다르게 하고 싶다면 7.0의 `@Proxyable`로 재정의할 수 있습니다.
