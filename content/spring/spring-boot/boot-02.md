---
slug: "boot-02"
topic: "spring-boot"
tier: BASIC
difficulty: 1
title: "`@SpringBootApplication`은 무엇으로 구성되어 있나요?"
keywords: ["@SpringBootConfiguration", "@EnableAutoConfiguration", "@ComponentScan", "메인 클래스 위치"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-boot/reference/using/using-the-springbootapplication-annotation.html", "https://docs.spring.io/spring-boot/reference/using/structuring-your-code.html", "https://docs.spring.io/spring-boot/reference/testing/spring-boot-applications.html"]
concepts: [auto-configuration, ioc-di]
importance: 2
links: [{to: "boot-16", kind: FOLLOWUP}, {to: "ioc-10", kind: RELATED}]
---
**모범 답변 (30~60초)**
`@SpringBootApplication`은 세 기능을 한 번에 켜는 편의 어노테이션입니다. `@SpringBootConfiguration`은 컨텍스트에 추가 빈을 등록하거나 다른 설정 클래스를 import하게 해 주는, 표준 `@Configuration`의 대안이고 통합 테스트에서 설정 탐지를 돕습니다. `@EnableAutoConfiguration`은 자동 설정을 켜고, `@ComponentScan`은 애플리케이션이 위치한 패키지에서 `@Component`를 스캔합니다. 그래서 메인 클래스는 보통 다른 클래스들보다 위의 루트 패키지에 둡니다. 세 기능 모두 필수는 아니어서, 스캔 없이 `@Import`로 설정을 명시하는 구성도 가능합니다.

```java
@SpringBootApplication   // = @SpringBootConfiguration + @EnableAutoConfiguration + @ComponentScan
public class MyApplication {
    public static void main(String[] args) {
        SpringApplication.run(MyApplication.class, args);
    }
}
```

- 공식 문서: 세 어노테이션을 합친 것이며 `@EnableAutoConfiguration`·`@ComponentScan`의 속성을 바꾸는 별칭도 제공한다. 어느 기능도 필수가 아니고, 예를 들어 `@SpringBootConfiguration`, `@EnableAutoConfiguration`, `@Import({...})`만 쓰면 컴포넌트 스캔과 설정 프로퍼티 스캔 없이 사용자 빈을 명시적으로 가져온다.
- 공식 문서(코드 구조): 메인 클래스를 루트 패키지에 두면 컴포넌트 스캔이 프로젝트 안으로 한정된다.
- 공식 문서(테스트 페이지): `@SpringBootTest` 등은 테스트가 있는 패키지에서 위로 올라가며 `@SpringBootApplication` 또는 `@SpringBootConfiguration` 클래스를 찾는다.
- (실험 확인) `@SpringBootApplication`이 붙은 클래스를 MergedAnnotations 로 조회하면 `@SpringBootConfiguration`, `@EnableAutoConfiguration`, `@ComponentScan`이 모두 존재하고, `@SpringBootApplication` 선언에 이 셋이 직접 달려 있다.
