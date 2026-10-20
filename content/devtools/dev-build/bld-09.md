---
slug: "bld-09"
topic: "dev-build"
tier: DEEP
difficulty: 2
title: "Gradle에서 `./gradlew build`를 실행하면 어떤 task가 어떤 순서로 실행되나요?"
keywords: ["build는 check와 assemble에 의존", "assemble은 jar에 의존", "check는 test에 의존", "--dry-run으로 순서 확인"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.gradle.org/current/userguide/java_plugin.html", "https://docs.gradle.org/current/userguide/build_lifecycle.html", "https://docs.spring.io/spring-boot/gradle-plugin/packaging.html"]
concepts: [build-tool]
importance: 2
links: [{to: "bld-21", kind: FOLLOWUP}, {to: "bld-08", kind: PREREQ}]
---
**모범 답변 (30~60초)**
`java` 플러그인에서 `build`는 `check`와 `assemble`에 의존하는 집합 task입니다. `assemble`은 `jar`에 의존해 결과물을 만들고, `check`는 `test`에 의존해 검증을 합니다. `jar`는 `classes`에 의존하고 `classes`는 `compileJava`와 `processResources`에 의존하므로, 결국 컴파일, 리소스 처리, 테스트, 패키징이 모두 실행됩니다. Gradle은 이 의존 관계로 만든 그래프에서 필요한 task만 의존되는 것이 먼저 오도록 실행하고, 실제로 실행하지 않고 순서만 보려면 `--dry-run`을 씁니다. 스프링 부트 플러그인을 적용하면 `assemble`이 `bootJar`에도 의존합니다.

```text
$ gradle build --dry-run
:compileJava SKIPPED
:processResources SKIPPED
:classes SKIPPED
:jar SKIPPED
:assemble SKIPPED
:compileTestJava SKIPPED
:processTestResources SKIPPED
:testClasses SKIPPED
:test SKIPPED
:check SKIPPED
:build SKIPPED
```

(공식 문서) Java 플러그인 문서는 `build`가 `check`, `assemble`에 의존하고, `assemble`이 `jar`에, `check`가 `test`에, `jar`가 `classes`에, `classes`가 `compileJava`와 `processResources`에, `test`가 `testClasses`에 의존한다고 표로 밝힌다. 스프링 부트 Gradle 플러그인 문서는 `assemble`이 `bootJar`에 의존하도록 구성된다고 한다.
(실험 확인) Gradle 9.5.1 임시 프로젝트에서 `build --dry-run`을 실행한 출력이 위와 같았다. 스프링 부트 플러그인을 적용한 다른 임시 프로젝트의 `build`에서는 `bootJar`와 `jar`가 모두 실행되었다.
