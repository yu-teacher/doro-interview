---
slug: "ioc-17"
topic: "ioc-di"
tier: TRICKY
difficulty: 3
title: "세터/필드 주입으로는 순환 의존이 왜 동작하나요? 그리고 Spring Boot는 이를 허용하나요?"
keywords: ["생성 후 채우기", "미완성 빈 노출", "비권장", "Boot의 순환 참조 기본 금지"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
세터나 필드 주입은 객체를 먼저 생성한 뒤 의존성을 나중에 채우기 때문에, 아직 완전히 초기화되지 않은 상태의 빈 참조를 상대에게 먼저 넘겨 줄 수 있어서 순환이 성립합니다. 공식 문서도 이 경우 한 빈이 완전히 초기화되기 전에 다른 빈에 주입된다고 설명합니다. 그러나 이는 초기화 전 객체가 노출되는 위험이 있어 권장되지 않습니다. Spring Boot는 2.6부터 기본적으로 순환 참조를 금지합니다. 세터나 필드 순환도 시작 단계에서 실패하고, `spring.main.allow-circular-references=true`로 다시 허용할 수 있습니다. 반면 부트 없이 순수 `AnnotationConfigApplicationContext`를 쓰면 필드 순환이 기본으로 허용됩니다.

- (공식 문서) 세터 순환은 한 빈이 완전히 초기화되기 전에 다른 빈에 주입된다는 점까지.
- (보충) 내부적으로 3단계 캐시(early singleton reference)를 쓴다는 설명은 이번에 읽은 공식 문서 페이지에서 확인하지 못한 내용이다.
- (실험 확인) Boot 4.1.1에서 필드 순환은 기본으로 실패한다(`UnsatisfiedDependencyException`, 원인 `BeanCurrentlyInCreationException`). `spring.main.allow-circular-references=true`를 주면 동작하고, 순수 `AnnotationConfigApplicationContext`는 기본 허용이며 `setAllowCircularReferences(false)`를 주면 실패한다. 이전에 미검증으로 표시했던 "Boot 4에서도 유지되는지"는 이 실험으로 확인되었다. 확인 테스트: `experiment/ioc/CircularDependencyExperimentTest`.
