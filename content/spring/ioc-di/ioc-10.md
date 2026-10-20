---
slug: "ioc-10"
topic: "ioc-di"
tier: DEEP
difficulty: 2
title: "컴포넌트 스캔은 어떻게 동작하고, 스테레오타입 애노테이션은 무엇이 다른가요?"
keywords: ["@ComponentScan", "메타 애노테이션", "@Service/@Repository/@Controller", "기본 빈 이름(lowerCamel)", "필터"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/beans/classpath-scanning.html", "https://docs.spring.io/spring-framework/reference/core/beans/definition.html", "https://docs.spring.io/spring-boot/reference/using/using-the-springbootapplication-annotation.html", "https://docs.spring.io/spring-boot/reference/using/structuring-your-code.html"]
---
**모범 답변 (30~60초)**
@ComponentScan이 지정한 패키지 아래 클래스패스를 훑어 @Component가 붙은 후보 클래스를 찾아 빈 정의로 자동 등록합니다. @Service, @Repository, @Controller는 모두 @Component를 메타 애노테이션으로 가진 특수화로, 계층 의미를 드러내고 도구나 AOP가 겨냥하기 쉽게 해 줍니다. 예를 들어 @Repository는 예외 변환 대상으로 표시하는 마커입니다. 빈 이름은 기본적으로 클래스 단순명의 첫 글자를 소문자로 바꾼 것이며 value로 직접 지정할 수 있습니다. includeFilters/excludeFilters로 범위를 조정할 수도 있습니다.

- (공식 문서) 스테레오타입은 @Component의 특수화(`@Service`는 `@Component`로 메타 애노테이션됨), `@Repository`는 자동 예외 변환 마커, 필터 종류(annotation 기본, assignable, aspectj, regex, custom)와 `includeFilters`/`excludeFilters`는 문서 내용이다. 이름은 `AnnotationBeanNameGenerator`가 명시 이름이 없으면 비정규화(uncapitalized) 클래스 단순명을 쓰며, 첫째·둘째 글자가 모두 대문자이면 원래 표기를 유지한다(`java.beans.Introspector.decapitalize` 규칙). 동일 이름 충돌을 피하려면 `FullyQualifiedAnnotationBeanNameGenerator`를 쓸 수 있고, Spring 7.0부터는 이름 없는 `@Bean` 메서드끼리의 충돌을 피하는 `FullyQualifiedConfigurationBeanNameGenerator`도 있다.
- (공식 문서, Spring Boot) `@SpringBootApplication`은 `@ComponentScan`을 포함하며, 애플리케이션 클래스가 있는 패키지를 대상으로 컴포넌트 스캔을 활성화한다.
