---
slug: "tst-02"
topic: "dev-test"
tier: BASIC
difficulty: 1
title: "JUnit 5는 어떤 모듈로 구성되어 있나요? (Platform, Jupiter, Vintage)"
keywords: ["JUnit Platform", "JUnit Jupiter", "JUnit Vintage", "TestEngine API", "JUnit 4 테스트 실행"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.junit.org/5.14.4/overview.html", "https://docs.junit.org/6.1.3/overview.html", "https://docs.spring.io/spring-boot/reference/testing/index.html"]
concepts: [mocking-junit]
importance: 2
links: [{to: "tst-03", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
JUnit 5는 JUnit Platform, Jupiter, Vintage 세 부분으로 이뤄집니다. Platform은 JVM에서 테스트 프레임워크를 실행하는 기반으로, `TestEngine` API와 콘솔 런처를 제공하고 IDE와 Gradle, Maven이 이것을 통해 테스트를 돌립니다. Jupiter는 `@Test` 같은 새 프로그래밍 모델과 확장 모델이고 Jupiter용 `TestEngine`을 포함합니다. Vintage는 JUnit 3과 4로 작성된 옛 테스트를 Platform 위에서 실행해 주는 엔진이라서, 기존 테스트를 점진적으로 옮길 때 씁니다.

(공식 문서) JUnit 5.14.4 User Guide의 Overview는 JUnit 5를 Platform, Jupiter, Vintage의 합으로 정의하고, Platform은 `TestEngine` API와 Console Launcher를 제공하며, Vintage는 JUnit 4.12 이상이 클래스패스에 있어야 한다고 한다. 현재 안정판(6.1.3) Overview도 같은 세 부분 구성이다. 5.14.4 Overview는 Platform이 IDE와 빌드 도구(Gradle, Maven, Ant)에서 first-class 지원을 받는다고 한다. 6.1.3 Overview는 Vintage 엔진이 deprecated이며 Jupiter 등으로 옮기는 동안 임시로만 쓰라고 한다. Spring Boot 4.1.1 테스트 문서는 `spring-boot-starter-test`가 JUnit Jupiter를 포함한다고 하고, JUnit 4 테스트는 JUnit 6의 vintage 엔진으로 돌리라고 안내한다. 즉 Boot 4.1 문서는 JUnit 6을 전제로 서술하므로, 사용하는 Boot 버전에 맞는 JUnit 버전을 확인해야 한다.
(실험 확인) 같은 테스트 클래스(생명주기, `@Nested`, `@ParameterizedTest`, `assertThrows`)를 Launcher API로 JUnit 5.12.2(플랫폼 1.12.2)와 6.0.3 양쪽에서 실행했을 때 실행 순서와 통과·실패 결과가 같았다. 다만 파라미터 테스트의 표시 이름은 달랐다. `@ValueSource(strings=...)`는 5.12.2에서 `[1] racecar`(컴파일에 `-parameters`를 주면 `[1] s=racecar`), 6.0.3에서는 `[1] "racecar"`(`-parameters`를 주면 `[1] s = "racecar"`)로 표시되어, 6에서는 문자열 인자가 따옴표로 감싸져 나왔다.
