---
slug: "aop-17"
topic: "aop-proxy"
tier: TRICKY
difficulty: 3
title: "같은 빈에 Aspect가 적용되는지 어떻게 확인하나요?"
keywords: ["AopUtils", "isCglibProxy", "클래스명 접미사", "getTargetClass"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
빈의 실제 클래스를 출력해서 `$$SpringCGLIB$$` 같은 접미사가 붙었는지 보거나, `AopUtils.isAopProxy`, `isCglibProxy`, `isJdkDynamicProxy` 같은 유틸로 확인합니다. 우리 프로젝트 TxExperimentTest가 `AopUtils.isCglibProxy`로 확인하는 방식입니다. 원본 클래스가 필요하면 `AopUtils.getTargetClass`를 씁니다.

```java
System.out.println("[proxy] " + experiment.getClass());
assertThat(AopUtils.isCglibProxy(experiment)).isTrue();
```

- 실험 코드 인용은 확인한 사실이다. `isAopProxy`, `getTargetClass`, 접미사 이름은 (보충)이며 이번에 문서에서 확인하지 않았다.
