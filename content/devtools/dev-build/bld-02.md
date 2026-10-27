---
slug: "bld-02"
topic: "dev-build"
tier: BASIC
difficulty: 2
title: "Gradle과 Maven은 무엇이 다른가요?"
keywords: ["XML 선언과 빌드 스크립트", "고정된 라이프사이클과 task 그래프", "증분 빌드와 빌드 캐시", "Gradle 데몬"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://maven.apache.org/guides/introduction/introduction-to-the-lifecycle.html", "https://maven.apache.org/guides/introduction/introduction-to-the-pom.html", "https://docs.gradle.org/current/userguide/build_lifecycle.html", "https://docs.gradle.org/current/userguide/incremental_build.html", "https://docs.gradle.org/current/userguide/build_cache.html", "https://docs.gradle.org/current/userguide/gradle_daemon.html"]
concepts: [build-tool]
importance: 3
links: [{to: "bld-06", kind: FOLLOWUP}, {to: "bld-08", kind: FOLLOWUP}, {to: "bld-01", kind: PREREQ}]
---
**모범 답변 (30~60초)**
Maven은 `pom.xml`에 프로젝트 정보를 XML로 선언하고, 미리 정해진 라이프사이클 단계에 플러그인 goal이 묶여 순서대로 실행되는 방식입니다. Gradle은 `settings.gradle`과 `build.gradle` 같은 빌드 스크립트를 실제로 실행해 task를 등록하고, task 사이의 의존 관계로 그래프를 만들어 필요한 것만 실행합니다. 그래서 Gradle 문서에는 입출력이 바뀌지 않은 task를 건너뛰는 증분 빌드, 다른 빌드의 결과를 재사용하는 빌드 캐시, 빌드 사이에 살아 있는 데몬 같은 속도 기능이 따로 정리되어 있습니다.

```text
$ gradle build --build-cache     # 두 번째 실행
> Task :compileJava UP-TO-DATE
> Task :jar UP-TO-DATE
$ gradle clean build --build-cache
> Task :compileJava FROM-CACHE
```

(공식 문서) Maven 가이드는 POM이 프로젝트 정보와 빌드 설정(의존성, 실행할 플러그인·goal, 프로필 등)을 담은 XML 파일이라고 하고, 패키징 종류(jar 등)에 따라 라이프사이클 단계에 묶이는 goal이 정해지며 goal은 플러그인이 제공한다고 설명한다. Gradle 문서는 빌드 스크립트가 구성 단계에 평가되어 task 그래프를 만들고, 입력과 출력이 바뀌지 않으면 task를 UP-TO-DATE로 건너뛰며, 빌드 캐시는 기본으로 꺼져 있고 `--build-cache` 또는 `org.gradle.caching=true`로 켠다고 한다. 데몬은 Gradle 3.0부터 기본으로 켜져 있다.
(실험 확인) Gradle 9.5.1 임시 프로젝트에서 `build`를 연달아 두 번 실행하자 두 번째는 `compileJava`와 `jar`가 UP-TO-DATE였다(소스가 없는 task는 NO-SOURCE로 표시된다). `--build-cache`(캐시 디렉터리는 프로젝트 안으로 지정)로 한 번 빌드한 뒤 `clean`하고 다시 빌드하니 `compileJava`가 FROM-CACHE로 나왔고, 같은 상태에서 옵션 없이 `clean build`를 하면 캐시를 쓰지 않고 다시 컴파일했다. 데몬 동작은 실행해 보지 않았다. Maven은 실험 환경에 없어 실행하지 않았다.
(보충) 어느 도구가 더 낫다는 판단은 팀의 기존 자산과 규약에 달린 일반 설명이며, 공식 문서가 우열을 매기지는 않는다.
