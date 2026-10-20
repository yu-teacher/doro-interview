---
slug: "ioc-10"
topic: "ioc-di"
tier: DEEP
difficulty: 2
title: "컴포넌트 스캔은 어떻게 동작하고, 스테레오타입 애노테이션은 무엇이 다른가요?"
keywords: ["@ComponentScan", "메타 애노테이션", "@Service/@Repository/@Controller", "기본 빈 이름(lowerCamel)", "필터"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
@ComponentScan이 지정한 패키지 아래 클래스패스를 훑어 @Component가 붙은 후보 클래스를 찾아 빈 정의로 자동 등록합니다. @Service, @Repository, @Controller는 모두 @Component를 메타 애노테이션으로 가진 특수화로, 계층 의미를 드러내고 도구나 AOP가 겨냥하기 쉽게 해 줍니다. 예를 들어 @Repository는 예외 변환 대상이 됩니다. 빈 이름은 기본적으로 클래스 단순명의 첫 글자를 소문자로 바꾼 것이며 value로 직접 지정할 수 있습니다. includeFilters/excludeFilters로 범위를 조정할 수도 있습니다.

- (공식 문서) 스테레오타입은 @Component의 특수화, @Repository는 예외 변환, 기본 이름 규칙, 필터 종류(annotation 기본, assignable, aspectj, regex, custom)는 문서 내용이다. 동일 이름 충돌을 피하려면 FullyQualifiedAnnotationBeanNameGenerator를 쓸 수 있고, Spring 7.0부터는 이름 없는 @Bean 메서드끼리의 충돌을 피하는 FullyQualifiedConfigurationBeanNameGenerator도 문서에 소개되어 있다.
- (보충) Spring Boot에서는 @SpringBootApplication이 @ComponentScan을 포함해, 메인 클래스 패키지 하위가 스캔 대상이다. 데모에서는 `com.kdt.board` 하위가 스캔된다.
