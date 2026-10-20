---
slug: "bld-01"
topic: "dev-build"
tier: BASIC
difficulty: 1
title: "자바 백엔드 프로젝트에서 빌드 도구(Gradle, Maven)는 무엇을 해 주나요?"
keywords: ["컴파일·테스트·패키징 자동화", "의존성 내려받기와 해석", "정해진 빌드 단계", "같은 명령으로 같은 절차"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://maven.apache.org/guides/introduction/introduction-to-the-lifecycle.html", "https://docs.gradle.org/current/userguide/build_lifecycle.html", "https://docs.gradle.org/current/userguide/dependency_resolution.html", "https://docs.gradle.org/current/userguide/java_plugin.html"]
concepts: [build-tool, dependency-management]
importance: 3
links: [{to: "bld-02", kind: FOLLOWUP}, {to: "bld-05", kind: FOLLOWUP}, {to: "cic-02", kind: RELATED}]
---
**모범 답변 (30~60초)**
빌드 도구는 소스를 컴파일하고 테스트를 돌리고 jar 같은 배포 결과물로 패키징하는 과정을 정해진 절차로 자동화합니다. 또 하나의 큰 역할이 의존성 관리인데, 프로젝트가 선언한 라이브러리를 저장소에서 내려받고 그 라이브러리가 다시 필요로 하는 것까지 계산해 클래스패스를 만들어 줍니다. Maven은 validate부터 deploy까지 단계를 미리 정해 두었고, Gradle은 task들을 의존 관계 그래프로 엮어 요청된 task와 그 선행 task만 실행합니다. 그래서 어디서든 같은 명령 하나로 같은 절차를 돌릴 수 있습니다.

```text
$ gradle build        # java 플러그인만 적용한 임시 프로젝트 (일부 줄 생략)
> Task :compileJava
> Task :jar
> Task :assemble
> Task :test NO-SOURCE
> Task :check UP-TO-DATE
> Task :build
```

(공식 문서) Maven 라이프사이클 가이드는 빌드와 배포 과정이 명확히 정의되어 있어 적은 수의 명령만 익히면 어떤 Maven 프로젝트든 빌드할 수 있다고 설명하고, default 라이프사이클의 단계(validate, compile, test, package, verify, install, deploy)를 나열한다. Gradle 빌드 라이프사이클 문서는 task들이 의존 관계로 방향 비순환 그래프(DAG)를 이룬다고 하고, 의존성 해석 문서는 해석을 그래프 구성 단계와 실제 파일(artifact)을 가져오는 단계의 두 단계로 설명한다.
(실험 확인) Gradle 9.5.1(JDK 25, `--offline`)에서 `java` 플러그인만 적용한 임시 프로젝트에 소스 파일 하나를 두고 `build`를 실행하니 위 출력(`classes`, `processResources` 같은 줄은 생략)과 같이 `compileJava`, `jar`, `assemble`, `check`, `build`가 차례로 돌아 `build/libs`에 jar가 생겼다. 테스트 소스가 없어서 `test`는 NO-SOURCE였다.
