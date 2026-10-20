---
slug: "boot-16"
topic: "spring-boot"
tier: TRICKY
difficulty: 3
title: "메인 클래스를 최상위 패키지에 두지 않으면 어떤 문제가 생기나요?"
keywords: ["스캔 범위", "auto-configuration packages", "@AutoConfigurationPackage"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-boot/reference/using/structuring-your-code.html", "https://docs.spring.io/spring-boot/reference/using/auto-configuration.html", "https://docs.spring.io/spring-boot/reference/using/using-the-springbootapplication-annotation.html"]
concepts: [auto-configuration, ioc-di]
importance: 1
links: [{to: "ioc-10", kind: RELATED}]
---
**모범 답변 (30~60초)**
`@ComponentScan`이 메인 클래스가 있는 패키지를 기준으로 스캔하기 때문에, 그 바깥 패키지의 컴포넌트는 발견되지 않아 빈으로 등록되지 않습니다. 또 JPA `@Entity`와 Spring Data 리포지토리를 찾는 기본 범위인 자동 설정 패키지도 `@EnableAutoConfiguration`이 붙은 클래스(`@SpringBootApplication` 포함)의 패키지로 정해지므로 같은 문제가 생깁니다. 그래서 메인 클래스는 다른 클래스들 위의 루트 패키지에 두고 하위 패키지에 모아 두는 것을 권장합니다. 불가피하면 `@AutoConfigurationPackage`로 패키지를 추가할 수 있습니다.

```text
com
 +- example
     +- myapplication
         +- MyApplication.java      <- @SpringBootApplication (루트 패키지)
         +- customer
         |   +- Customer.java, CustomerController.java, ...
         +- order
             +- Order.java, OrderRepository.java, ...
```

- 공식 문서(코드 구조): 메인 클래스를 다른 클래스 위의 루트 패키지에 두는 것을 권장한다. `@SpringBootApplication`은 암묵적으로 특정 항목의 기준 "search package"를 정의하며, 예를 들어 JPA 앱이면 이 클래스의 패키지에서 `@Entity`를 찾는다. 루트 패키지를 쓰면 컴포넌트 스캔이 프로젝트에만 적용된다. 이 동작은 `@SpringBootApplication`이 가져오는 `@EnableAutoConfiguration`과 `@ComponentScan`이 정의한다.
- 공식 문서: 자동 설정 패키지는 여러 자동 설정 기능이 엔티티와 Spring Data 리포지토리를 기본으로 찾는 패키지이고, `@EnableAutoConfiguration`(직접 또는 `@SpringBootApplication`을 통해)이 기본 패키지를 결정한다. 추가 패키지는 `@AutoConfigurationPackage`로 설정한다.
- 공식 문서: 패키지 선언이 없는 "default package"는 일반적으로 피해야 하며 `@ComponentScan` 등을 쓸 때 모든 jar의 모든 클래스를 읽는 문제가 생긴다.
