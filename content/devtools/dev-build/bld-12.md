---
slug: "bld-12"
topic: "dev-build"
tier: DEEP
difficulty: 2
title: "같은 라이브러리가 서로 다른 버전으로 전이 의존될 때 Gradle과 Maven은 어떤 버전을 고르나요?"
keywords: ["Gradle은 가장 높은 버전", "Maven은 가장 가까운 선언", "같은 깊이면 먼저 선언한 것", "dependencyInsight로 원인 확인"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.gradle.org/current/userguide/graph_resolution.html", "https://docs.gradle.org/current/userguide/dependency_versions.html", "https://docs.gradle.org/current/userguide/resolution_rules.html", "https://maven.apache.org/guides/introduction/introduction-to-dependency-mechanism.html"]
concepts: [dependency-management]
importance: 2
links: [{to: "bld-16", kind: FOLLOWUP}, {to: "bld-05", kind: PREREQ}]
---
**모범 답변 (30~60초)**
Gradle은 의존성 그래프에서 요청된 버전들 가운데 기본으로 가장 높은 버전을 고릅니다. 예를 들어 한쪽이 D 1.0을, 다른 쪽이 D 2.0을 끌고 오면 2.0이 선택되고, 왜 그렇게 되었는지는 `dependencyInsight`에서 conflict resolution으로 표시됩니다. Maven은 이른바 nearest definition으로 의존성 트리에서 내 프로젝트에 더 가까운 선언의 버전을 쓰고, 깊이가 같으면 먼저 선언한 쪽이 이깁니다. 그래서 같은 그래프라도 두 도구가 다른 버전을 고를 수 있고, Gradle은 `failOnVersionConflict()`로 충돌 시 빌드를 실패시킬 수도 있습니다.

```text
$ gradle dependencyInsight --dependency ex:d --configuration runtimeClasspath   # (Variant 표 등 일부 생략)
ex:d:2.0
   Selection reasons:
      - By conflict resolution: between versions 2.0 and 1.0
ex:d:1.0 -> 2.0
\--- ex:e:1.0
```

(공식 문서) Gradle 그래프 해석 문서는 버전 충돌 시 요청된 모든 버전 중 기본으로 가장 높은 버전을 고른다고 한다. 한정자가 없는 버전(릴리스)을 선호한다. 해석 규칙 문서에는 `failOnVersionConflict()`가 있다. Maven 가이드는 의존성 중재가 nearest definition이고 같은 깊이면 먼저 선언한 것이 이긴다고 하며, 예시에서 A→B→C→D 2.0과 A→E→D 1.0이면 D 1.0이 쓰인다.
(실험 확인) Gradle 9.5.1에서 위 구조(b→c→d 2.0, e→d 1.0)를 로컬 저장소로 만들어 해석하니 d 2.0이 선택되었고 선택 이유가 `By conflict resolution`이었다. `failOnVersionConflict()`를 켜면 `dependencies` 출력에서 두 d가 모두 FAILED로 표시되었다. Maven의 nearest 동작은 Maven이 없어 실행하지 않았고 문서 설명만 인용했다.
