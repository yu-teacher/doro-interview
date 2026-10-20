---
slug: "boot-02"
topic: "spring-boot"
tier: BASIC
difficulty: 1
title: "`@SpringBootApplication`은 무엇으로 구성되어 있나요?"
keywords: ["@SpringBootConfiguration", "@EnableAutoConfiguration", "@ComponentScan", "메인 클래스 위치"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
"세 어노테이션을 합친 편의 어노테이션입니다. `@SpringBootConfiguration`은 이 클래스가 설정 클래스임을 나타내고, `@EnableAutoConfiguration`은 클래스패스에 따라 자동 설정을 켭니다. `@ComponentScan`은 이 클래스가 있는 패키지 아래의 `@Component`를 스캔합니다. 그래서 메인 클래스는 보통 최상위 패키지에 둡니다. 세 가지 모두 필수는 아니라서, 스캔을 끄고 `@Import`로 명시적으로 설정을 가져오는 구성도 가능합니다."

```java
// 공식 문서의 설명과 동일한 개념
@SpringBootApplication
public class BoardApplication {
    public static void main(String[] args) {
        SpringApplication.run(BoardApplication.class, args);
    }
}
```

- 공식 문서: `@SpringBootConfiguration`은 일반 `@Configuration`의 대안으로, 통합 테스트에서 설정 탐지를 돕는다. 세 기능 중 어느 것도 필수가 아니다.
- 공식 문서(테스트 페이지): `@SpringBootTest`는 테스트 패키지에서 위로 올라가며 `@SpringBootApplication` 또는 `@SpringBootConfiguration` 클래스를 찾는다.
