---
slug: "bld-17"
topic: "dev-build"
tier: TRICKY
difficulty: 3
title: "`compileOnly`로 선언한 라이브러리를 테스트 코드에서 쓰면 왜 문제가 되고, 어떻게 해결하나요?"
keywords: ["compileOnly는 테스트 클래스패스에 없음", "testCompileOnly 별도 선언", "testImplementation으로 추가", "Maven provided는 테스트에 포함"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.gradle.org/current/userguide/java_plugin.html", "https://docs.gradle.org/current/userguide/java_library_plugin.html", "https://docs.spring.io/spring-boot/gradle-plugin/packaging.html", "https://maven.apache.org/guides/introduction/introduction-to-dependency-mechanism.html"]
---
**모범 답변 (30~60초)**
`compileOnly`는 메인 소스셋의 컴파일에만 쓰이는 구성이라, 테스트 소스셋의 컴파일 클래스패스와 런타임 클래스패스에는 들어가지 않습니다. 그래서 테스트 코드가 그 라이브러리의 클래스를 참조하면 컴파일 클래스패스에 없어서 문제가 됩니다. 테스트에서도 필요하면 `testCompileOnly`나 `testImplementation`에 따로 선언해야 합니다. Maven의 `provided`는 테스트 클래스패스에도 들어가서 이 점이 다릅니다. 스프링 부트 문서도 같은 이유로 war 패키징에서 `compileOnly` 대신 `providedRuntime`을 권합니다.

```text
lib 의 testCompileClasspath : apilib, impllib, tst     (compileOnly 로 선언한 co 가 없음)
lib 의 compileClasspath     : apilib, co, impllib
```

(공식 문서) Java 플러그인 문서는 `testCompileClasspath`가 `testCompileOnly`와 `testImplementation`을 확장하고, `testImplementation`이 `implementation`을 확장한다고 밝힌다. `compileOnly`는 `compileClasspath`에만 연결되므로 테스트 클래스패스에는 없다. 스프링 부트 문서는 `compileOnly`가 테스트 클래스패스에 없어 웹 통합 테스트가 실패할 수 있다는 이유로 `providedRuntime`을 선호한다고 한다. Maven 가이드는 provided가 컴파일과 테스트 클래스패스에 있다고 한다.
(실험 확인) Gradle 9.5.1에서 `compileOnly 'ex:co:1.0'`과 `testImplementation 'ex:tst:1.0'`을 선언한 `java-library` 프로젝트의 클래스패스를 출력하니 `co`가 컴파일 클래스패스에만 있고 테스트 컴파일·런타임 클래스패스에는 없었다. 또 `co` jar에 클래스 하나를 넣고 메인 코드와 테스트 코드가 그 클래스를 참조하게 했더니, `compileOnly`만 있을 때 `compileJava`는 성공하고 `compileTestJava`는 `package ex does not exist` 오류로 실패했으며, `testCompileOnly`를 추가하자 성공했다.
