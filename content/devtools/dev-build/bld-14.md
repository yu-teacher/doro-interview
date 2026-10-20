---
slug: "bld-14"
topic: "dev-build"
tier: DEEP
difficulty: 2
title: "Gradle 멀티 모듈(멀티 프로젝트) 빌드는 어떻게 구성하고, 모듈 간 의존은 어떻게 선언하나요? Maven과는 어떻게 다른가요?"
keywords: ["settings 파일의 include", "project 의존성", "루트와 서브프로젝트", "Maven reactor 빌드 순서"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.gradle.org/current/userguide/multi_project_builds.html", "https://maven.apache.org/guides/mini/guide-multiple-modules.html", "https://maven.apache.org/guides/introduction/introduction-to-the-pom.html"]
---
**모범 답변 (30~60초)**
Gradle 멀티 프로젝트는 루트의 `settings.gradle`에서 `include 'lib', 'app'`처럼 서브프로젝트를 선언하고, 각 서브프로젝트 디렉터리에 자기 `build.gradle`을 두어 플러그인과 의존성을 따로 정합니다. 모듈 사이 의존은 `implementation project(':lib')`처럼 project 의존성으로 선언하고, Gradle이 그에 맞춰 빌드 순서를 정합니다. Maven은 부모 POM이 `modules`로 하위 모듈을 모으는 집합(aggregation) 방식이고, reactor가 모듈들을 의존 관계에 맞게 정렬해 순서대로 빌드합니다. 루트 프로젝트 이름은 settings 파일에서 정해 두는 것이 안전합니다.

```groovy
// settings.gradle
rootProject.name = 'exp2'
include 'lib', 'app'
// app/build.gradle
dependencies { implementation project(':lib') }
```

(공식 문서) Gradle 멀티 프로젝트 문서는 루트 프로젝트와 서브프로젝트를 `settings.gradle`에서 `include()`로 정의하고, 프로젝트 의존성으로 다른 서브프로젝트에 의존한다고 한다. 루트 이름을 설정하지 않으면 디렉터리 이름을 쓰는데 불안정하다고 한다. Maven 가이드는 reactor가 빌드할 모듈을 모으고, 프로젝트 간 의존에 맞는 순서로 정렬하며, 정렬된 순서대로 빌드한다고 설명한다. POM 소개는 상속(자식이 부모를 지정)과 집합(부모가 모듈을 지정)을 따로 또는 함께 쓸 수 있다고 설명한다.
(실험 확인) Gradle 9.5.1에서 위 구성(lib는 `java-library`)을 만들고 app의 런타임 클래스패스를 출력하니 `lib.jar`가 포함되었다. 즉 project 의존성이 lib의 jar로 해석되었다. Maven의 reactor는 Maven이 없어 실행하지 않았다.
