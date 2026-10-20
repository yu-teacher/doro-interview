---
slug: "bld-08"
topic: "dev-build"
tier: DEEP
difficulty: 2
title: "Gradle 빌드의 세 단계(초기화, 구성, 실행)는 각각 무엇을 하나요?"
keywords: ["초기화·구성·실행", "settings 파일 평가", "구성 단계에서 task 그래프 구성", "실행 단계에 task 실행"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.gradle.org/current/userguide/build_lifecycle.html"]
concepts: [build-tool]
importance: 2
links: [{to: "bld-09", kind: FOLLOWUP}, {to: "bld-19", kind: FOLLOWUP}, {to: "bld-02", kind: PREREQ}]
---
**모범 답변 (30~60초)**
Gradle 빌드는 초기화, 구성, 실행 세 단계가 순서대로 돕니다. 초기화에서는 `settings.gradle`을 평가해 어떤 프로젝트와 포함 빌드가 참여하는지 정하고 Project 객체를 만듭니다. 구성 단계에서는 참여하는 모든 프로젝트의 `build.gradle`을 평가해 task를 등록하고, task 사이의 의존 관계로 task 그래프를 만듭니다. 마지막 실행 단계에서 그 그래프를 따라 요청된 task들의 동작을 수행합니다. 그래서 task 본문에서 `doLast`나 `doFirst` 안에 있는 코드만 실행 단계에서 돕니다.

```text
SETTINGS: initialization phase
> Configure project :
BUILD SCRIPT BODY: configuration phase
both: config-time body
> Task :both
both: doFirst EXEC
both: doLast EXEC
```

(공식 문서) Build Lifecycle 문서는 초기화에서 settings 파일을 평가하고 프로젝트들을 감지하며, 구성에서 모든 프로젝트의 빌드 파일을 평가해 task 그래프를 만들고, 실행에서 선택된 task를 실행한다고 설명한다. 문서의 시간표에는 의존성 그래프 해석과 artifact 해석이 보통 실행 단계로 미뤄지지만, 구성에서 해석 결과를 열어 보는 코드가 있으면 그 시점에 해석된다는 설명이 있다(구성 캐시를 켜면 구성 단계에서 해석한다).
(실험 확인) Gradle 9.5.1에서 `settings.gradle`의 `println`, `build.gradle` 최상위의 `println`, task 등록 블록 안의 `println`, `doFirst`와 `doLast` 안의 `println`을 두고 그 task를 실행하니 위 순서로 출력되었다.
