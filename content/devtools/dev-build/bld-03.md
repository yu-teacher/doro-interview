---
slug: "bld-03"
topic: "dev-build"
tier: BASIC
difficulty: 1
title: "Gradle에서 `implementation`, `compileOnly`, `runtimeOnly`, `testImplementation`은 각각 언제 쓰나요?"
keywords: ["컴파일과 실행 모두 필요", "컴파일 때만 필요", "실행 때만 필요", "테스트 전용"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.gradle.org/current/userguide/java_plugin.html", "https://docs.gradle.org/current/userguide/java_library_plugin.html"]
---
**모범 답변 (30~60초)**
`implementation`은 컴파일과 실행에 모두 필요한 일반 의존성입니다. `compileOnly`는 컴파일할 때만 필요하고 런타임 클래스패스에는 들어가지 않으며, `runtimeOnly`는 반대로 컴파일에는 쓰지 않고 실행할 때만 필요한 것, 예를 들어 JDBC 드라이버 같은 것에 씁니다. `testImplementation`은 테스트 코드를 컴파일하고 실행할 때만 필요한 JUnit 같은 라이브러리용이라 운영 결과물에는 들어가지 않습니다. 이 구성들이 모여 `compileClasspath`, `runtimeClasspath` 같은 실제 클래스패스가 만들어집니다.

```groovy
dependencies {
  api 'ex:apilib:1.0'
  implementation 'ex:impllib:1.0'
  compileOnly 'ex:co:1.0'
  runtimeOnly 'ex:ro:1.0'
  testImplementation 'ex:tst:1.0'
}
// 결과(java-library 프로젝트)
// compileClasspath     : apilib, co, impllib
// runtimeClasspath     : apilib, impllib, ro
// testCompileClasspath : apilib, impllib, tst
// testRuntimeClasspath : apilib, impllib, ro, tst
```

(공식 문서) Java 플러그인 문서는 `implementation`을 메인 소스셋의 컴파일과 실행 모두에 필요한 것, `compileOnly`를 컴파일에만 필요하고 런타임 클래스패스에 포함되지 않는 것, `runtimeOnly`를 실행에만 필요하고 컴파일 클래스패스에 포함되지 않는 것, `testImplementation`을 테스트 소스셋의 컴파일과 실행에 필요한 것으로 설명한다. `compileClasspath`는 `compileOnly`와 `implementation`을 확장하고, `runtimeClasspath`는 `runtimeOnly`와 `implementation`을 확장한다.
(실험 확인) Gradle 9.5.1에서 `java-library` 프로젝트(로컬 파일 저장소의 빈 jar들)에 위 선언을 두고 각 클래스패스를 출력한 결과가 코드 주석과 같았다. 즉 `co`는 컴파일에만, `ro`는 실행에만 있었다.
