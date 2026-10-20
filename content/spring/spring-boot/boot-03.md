---
slug: "boot-03"
topic: "spring-boot"
tier: BASIC
difficulty: 1
title: "자동 설정(auto-configuration)은 어떻게 동작하나요?"
keywords: ["AutoConfiguration.imports", "@AutoConfiguration", "@Conditional*", "--debug", "conditions report"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
"클래스패스에 있는 라이브러리를 보고 필요한 빈을 자동으로 등록하는 기능입니다. 예를 들어 임베디드 DB가 클래스패스에 있고 직접 DB 연결 빈을 정의하지 않았다면 인메모리 DB를 구성해 줍니다. 자동 설정 클래스 목록은 jar 안의 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` 파일에 한 줄에 하나씩 적혀 있고, 각 클래스는 `@ConditionalOnClass`, `@ConditionalOnMissingBean`, `@ConditionalOnProperty` 같은 조건이 맞을 때만 적용됩니다. 어떤 게 왜 적용됐는지는 `--debug`로 실행하면 조건 평가 리포트로 볼 수 있습니다."

```text
# META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
com.mycorp.libx.autoconfigure.LibXAutoConfiguration
```

- 공식 문서: 자동 설정은 `@EnableAutoConfiguration` 또는 `@SpringBootApplication`으로 활성화한다.
- 공식 문서: 자동 설정 클래스는 이 imports 파일에 나열해서만 로드하며, 컴포넌트 스캔 대상이 되면 안 된다.
- 공식 문서: `--debug`로 실행하면 조건 리포트가 콘솔에 출력된다.
