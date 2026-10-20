---
slug: "ioc-17"
topic: "ioc-di"
tier: TRICKY
difficulty: 3
title: "세터/필드 주입으로는 순환 의존이 왜 동작하나요? 그리고 Spring Boot는 이를 허용하나요?"
keywords: ["생성 후 채우기", "미완성 빈 노출", "비권장", "Boot의 순환 참조 기본 금지"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-collaborators.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/support/AbstractAutowireCapableBeanFactory.html", "https://docs.spring.io/spring-boot/api/java/org/springframework/boot/SpringApplication.html", "https://docs.spring.io/spring-boot/appendix/application-properties/index.html"]
concepts: [ioc-di]
importance: 1
links: [{to: "ioc-15", kind: PREREQ}]
---
**모범 답변 (30~60초)**
세터나 필드 주입은 객체를 먼저 생성한 뒤 의존성을 나중에 채우기 때문에, 아직 완전히 초기화되지 않은 상태의 빈 참조를 상대에게 먼저 넘겨 줄 수 있어서 순환이 성립합니다. 공식 문서도 이 경우 한 빈이 완전히 초기화되기 전에 다른 빈에 주입된다고 설명합니다. 그러나 이는 초기화 전 객체가 노출되는 위험이 있어 권장되지 않습니다. Spring Boot는 2.6부터 기본적으로 순환 참조를 금지합니다. 세터나 필드 순환도 시작 단계에서 실패하고, spring.main.allow-circular-references=true로 다시 허용할 수 있습니다. 반면 부트 없이 순수 AnnotationConfigApplicationContext를 쓰면 필드 순환이 기본으로 허용됩니다.

- (공식 문서) 세터 순환은 한 빈이 완전히 초기화되기 전에 다른 빈에 주입되며 권장되지 않는다(collaborators 페이지). Javadoc은 순환 참조 해결이 "관련된 빈 중 하나가 아직 완전히 초기화되지 않은 다른 빈의 참조를 받는다"는 뜻이며 초기화에 미묘한 부작용을 낼 수 있고, 프레임워크 컨테이너(`AbstractAutowireCapableBeanFactory`)의 `allowCircularReferences` 기본값은 true라고 밝힌다. Boot의 `SpringApplication.setAllowCircularReferences`는 2.6.0부터 있고 기본값이 false이며 프로퍼티 `spring.main.allow-circular-references`의 기본값도 false다.
- (실험 확인) Boot 4.1.1에서 필드 순환은 기본으로 실패한다(`UnsatisfiedDependencyException`, 원인 `BeanCurrentlyInCreationException`). `spring.main.allow-circular-references=true`를 주면 동작하고, 순수 `AnnotationConfigApplicationContext`는 기본 허용이며 `setAllowCircularReferences(false)`를 주면 실패한다.
