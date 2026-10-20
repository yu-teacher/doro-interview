---
slug: "tst-11"
topic: "dev-test"
tier: DEEP
difficulty: 2
title: "`@SpringBootTest`와 슬라이스 테스트(`@WebMvcTest`, `@DataJpaTest`)는 무엇이 다르고 언제 어떤 걸 쓰나요?"
keywords: ["전체 ApplicationContext 로드", "@WebMvcTest는 웹 계층만", "@DataJpaTest는 JPA 계층만", "@MockitoBean으로 협력자 대체", "슬라이스는 하나만"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-boot/reference/testing/spring-boot-applications.html", "https://docs.spring.io/spring-framework/reference/testing/annotations/integration-spring/annotation-mockitobean.html"]
concepts: [test-strategy]
importance: 3
links: [{to: "tst-13", kind: FOLLOWUP}, {to: "tst-15", kind: FOLLOWUP}, {to: "tst-16", kind: FOLLOWUP}, {to: "tst-01", kind: PREREQ}, {to: "boot-14", kind: RELATED}]
---
**모범 답변 (30~60초)**
`@SpringBootTest`는 `SpringApplication`으로 애플리케이션 컨텍스트 전체를 띄워서 실제 빈 배선까지 확인하는 통합 테스트입니다. 슬라이스 테스트는 계층 하나에 필요한 자동 설정과 빈만 로드합니다. `@WebMvcTest`는 컨트롤러, `@ControllerAdvice`, 필터 같은 MVC 구성요소만 스캔하고 `MockMvc`를 구성하므로 서비스 같은 협력자는 `@MockitoBean`으로 채웁니다. `@DataJpaTest`는 `@Entity`와 Spring Data JPA 리포지토리만 구성하고 기본적으로 트랜잭션을 걸어 테스트마다 롤백합니다. 슬라이스 애노테이션은 한 테스트에 하나만 쓸 수 있습니다. 컨트롤러 매핑이나 JPA 쿼리만 보면 슬라이스가, 계층을 가로지르는 흐름은 `@SpringBootTest`가 맞습니다.

(공식 문서) Spring Boot 4.1.1 Testing Spring Boot Applications 문서는 `@SpringBootTest`가 `SpringApplication`으로 컨텍스트를 만들고, 슬라이스는 컴포넌트 스캔을 제한하고 매우 제한된 자동 설정만 로드하며, 여러 슬라이스 애노테이션을 한 테스트에 같이 쓰는 것은 지원하지 않는다고 한다. `@WebMvcTest`는 컨트롤러 등 정해진 빈만 스캔하고 일반 `@Component`는 스캔하지 않으며 `@MockitoBean`과 함께 쓰는 것이 흔하다고 한다. `@DataJpaTest`는 `@Entity`를 스캔하고 기본으로 트랜잭션을 걸어 롤백한다고 한다. Boot 4에서는 `@WebMvcTest`가 `org.springframework.boot.webmvc.test.autoconfigure`, `@DataJpaTest`가 `org.springframework.boot.data.jpa.test.autoconfigure` 패키지에 있다(예시 코드의 import 기준).
(실험 확인) Spring Boot 4.1.0, H2 인메모리 DB로 만든 실험 프로젝트(컨트롤러 2개, 서비스, `JdbcTemplate` 리포지토리, JPA 엔티티와 리포지토리 1개씩)에서 `@SpringBootTest`의 컨텍스트는 빈 정의가 230개이고 리포지토리와 `JdbcTemplate`이 있었다. `@WebMvcTest(GreetController.class)`에 `@MockitoBean`으로 서비스를 채운 컨텍스트는 빈 정의 124개였고 리포지토리, `JdbcTemplate`, 다른 컨트롤러 빈은 없었으며 `MockMvcTester`로 `GET /greet/kim`이 목이 정한 `mocked kim`을 돌려줬다. `@DataJpaTest` 컨텍스트는 빈 정의 83개로 JPA 리포지토리는 있었지만 `@Service`인 서비스와 컨트롤러 빈은 없었고, 테스트 트랜잭션이 활성(true)이었으며 한 테스트가 저장한 행(개수 1)이 다음 테스트에서는 0개였다(롤백). 빈 정의 개수는 프로젝트 구성에 따라 달라지는 값이다.
