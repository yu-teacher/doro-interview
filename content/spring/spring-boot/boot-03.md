---
slug: "boot-03"
topic: "spring-boot"
tier: BASIC
difficulty: 1
title: "자동 설정(auto-configuration)은 어떻게 동작하나요?"
keywords: ["AutoConfiguration.imports", "@AutoConfiguration", "@Conditional*", "--debug", "conditions report"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-boot/reference/using/auto-configuration.html", "https://docs.spring.io/spring-boot/reference/features/developing-auto-configuration.html"]
concepts: [auto-configuration]
importance: 3
links: [{to: "boot-04", kind: FOLLOWUP}, {to: "boot-05", kind: FOLLOWUP}, {to: "boot-19", kind: FOLLOWUP}, {to: "ioc-27", kind: RELATED}]
---
**모범 답변 (30~60초)**
자동 설정은 클래스패스의 jar 의존성을 보고 필요한 빈을 자동으로 구성하는 기능입니다. 예를 들어 HSQLDB가 있고 DB 연결 빈을 직접 설정하지 않았다면 인메모리 DB를 구성합니다. `@EnableAutoConfiguration`이나 `@SpringBootApplication`으로 켜고, 대상은 `@AutoConfiguration` 클래스로 jar의 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` 파일에 한 줄에 하나씩 나열됩니다. 각 클래스는 `@ConditionalOnClass`, `@ConditionalOnMissingBean` 같은 `@Conditional*` 조건이 맞을 때만 적용되고, `--debug`로 실행하면 조건 평가 리포트(conditions report)가 출력됩니다.

```text
# META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
com.mycorp.libx.autoconfigure.LibXAutoConfiguration
```

- 공식 문서: 자동 설정은 `@EnableAutoConfiguration` 또는 `@SpringBootApplication`으로 옵트인하며, 둘 중 하나만 주 `@Configuration` 클래스에 한 번 붙이는 것을 권장한다.
- 공식 문서: `@AutoConfiguration`은 `@Configuration`을 메타 어노테이션으로 가진다. 자동 설정은 imports 파일에 이름을 적어서만 로드해야 하고 컴포넌트 스캔 대상이 되면 안 된다. 파일에는 `#` 주석을 쓸 수 있다.
- 공식 문서: 핵심 자동 설정 목록은 `spring-boot-autoconfigure`의 imports 파일에서 볼 수 있고, 다른 모듈에도 같은 파일이 있다. Boot 4는 모듈이 나뉘어 있어서 예컨대 `DataSourceAutoConfiguration`의 패키지는 `org.springframework.boot.jdbc.autoconfigure`이다.
- 공식 문서: `--debug`로 시작하면 일부 핵심 로거의 디버그 로그를 켜고 조건 리포트를 콘솔에 출력한다.
- (실험 확인) 클래스패스의 `AutoConfiguration.imports` 파일들을 모아 보면 `DataSourceAutoConfiguration`(`org.springframework.boot.jdbc.autoconfigure`)과 `HibernateJpaAutoConfiguration`(`org.springframework.boot.hibernate.autoconfigure`)이 들어 있다.
