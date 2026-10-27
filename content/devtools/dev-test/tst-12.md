---
slug: "tst-12"
topic: "dev-test"
tier: DEEP
difficulty: 2
title: "Spring Boot 4 테스트에서 빈을 목으로 바꾸려면 어떻게 하나요? `@MockBean`과 `@MockitoBean`은 무엇이 다른가요?"
keywords: ["@MockitoBean", "Spring Framework 제공", "컨텍스트 캐시 키 변경", "REPLACE_OR_CREATE 전략", "@MockitoSpyBean"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-framework/reference/testing/annotations/integration-spring/annotation-mockitobean.html", "https://docs.spring.io/spring-framework/reference/testing/testcontext-framework/bean-overriding.html", "https://docs.spring.io/spring-framework/reference/testing/testcontext-framework/ctx-management/caching.html", "https://docs.spring.io/spring-boot/reference/testing/spring-boot-applications.html", "https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide"]
concepts: [test-strategy, mocking-junit]
importance: 2
links: [{to: "tst-13", kind: FOLLOWUP}, {to: "tst-05", kind: PREREQ}, {to: "boot-15", kind: RELATED}]
---
**모범 답변 (30~60초)**
컨텍스트 안의 빈을 Mockito 목으로 바꾸려면 테스트 클래스 필드에 `@MockitoBean`을, 실제 빈을 감싼 스파이로 바꾸려면 `@MockitoSpyBean`을 붙입니다. 이 둘은 Spring Framework 자체가 제공하는 테스트 애노테이션이고, Boot 4 문서도 이것을 쓰라고 안내합니다. `@MockitoBean`의 기본 전략은 같은 타입의 빈이 있으면 교체하고 없으면 새로 만드는 `REPLACE_OR_CREATE`입니다. 예전 Boot의 `@MockBean`은 Boot 4.1.0의 `spring-boot-test` jar에서 찾을 수 없었습니다. 주의할 점은 목 구성이 컨텍스트 캐시 키에 들어가서, 테스트 클래스마다 목 구성이 다르면 컨텍스트가 새로 만들어져 테스트가 느려진다는 것입니다.

(공식 문서) Spring Framework의 `@MockitoBean` 문서는 이 애노테이션이 컨텍스트의 빈을 Mockito 목으로 교체하며 기본이 `REPLACE_OR_CREATE`이고, `@MockitoSpyBean`은 원래 빈을 감싸는 `WRAP` 전략이라고 설명한다. 교체된 목은 Spring AOP 프록시로 감싸지지 않으며, 한정자(필드 이름 포함)가 별도 컨텍스트가 필요한지 결정하므로 여러 테스트에서 같은 빈을 목으로 만들 때는 필드 이름을 일관되게 지으라고 한다. 캐싱 문서는 `@MockitoBean` 같은 빈 오버라이드가 컨텍스트 커스터마이저로서 캐시 키에 포함된다고 한다. Boot 4.1.1 문서의 Mocking and Spying Beans 절은 `@MockitoBean`과 `@MockitoSpyBean`을 쓰라고 안내한다.
(실험 확인) `spring-boot-test` 3.5.10 jar에는 `org.springframework.boot.test.mock.mockito.MockBean`과 `SpyBean` 클래스가 있었고, 4.1.0과 4.1.1 jar에는 `MockBean`, `SpyBean`, `MockitoBean` 어느 것도 없었다(`unzip -l`로 확인, 로컬 캐시에 있는 4.1.x 계열 `org.springframework.boot` jar 전체에서도 `MockBean.class`는 찾지 못했다). Boot 4.1.0 실험 프로젝트에서 설정이 같은 `@SpringBootTest` 클래스 둘은 같은 컨텍스트(객체 해시가 같음)를 썼고, `@MockitoBean`을 추가한 클래스는 다른 컨텍스트를 썼다.
Spring Boot 4.0 Migration Guide(공식 위키)의 "@MockBean and @SpyBean Removal" 절은 해당 지원이 4.0에서 제거되고 `@MockitoBean`으로 대체됐다고 한다.
