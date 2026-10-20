---
slug: "bld-16"
topic: "dev-build"
tier: TRICKY
difficulty: 3
title: "라이브러리 D 1.0을 직접 선언했는데 다른 의존성이 끌고 온 D 2.0이 쓰였습니다. 왜 그런가요? 1.0으로 고정하려면요?"
keywords: ["직접 선언도 최고 버전 경쟁", "strictly로 고정", "constraints로 전이 버전 지정", "Maven은 직접 선언이 우선"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.gradle.org/current/userguide/dependency_versions.html", "https://docs.gradle.org/current/userguide/dependency_constraints.html", "https://docs.gradle.org/current/userguide/graph_resolution.html", "https://maven.apache.org/guides/introduction/introduction-to-dependency-mechanism.html"]
---
**모범 답변 (30~60초)**
Gradle에서 `'ex:d:1.0'`처럼 간단히 쓴 버전은 고정이 아니라 필요한 버전이라는 요구일 뿐이라, 다른 경로에서 2.0이 요구되면 충돌 해결에서 가장 높은 2.0이 이깁니다. 낮은 버전으로 고정하려면 `strictly`를 써야 하고, 문서에 따르면 직접 선언한 의존성의 `strictly`는 버전을 내릴 수 있습니다. 전이 의존성의 버전만 바꾸고 싶을 때는 의존성 제약(`constraints`)을 쓰는데, 제약은 기본으로 엄격하지 않아서 요구보다 낮추지는 못합니다. Maven은 이와 달리 직접 선언한 쪽이 가까워서 이깁니다.

```groovy
implementation 'ex:b:1.0'   // b -> c -> d:2.0
implementation 'ex:e:1.0'   // e -> d:1.0
implementation 'ex:d:1.0'   // 결과: d:1.0 -> 2.0

implementation('ex:d') { version { strictly '1.0' } }   // 결과: d:1.0, 전이 2.0 도 1.0 으로
```

(공식 문서) Gradle 버전 문서는 `strictly`가 허용 버전을 제한하며 선언된 의존성에 쓰면 버전을 낮출 수 있다고 하고, 옛 `force`를 대체하는 것이라고 한다. 의존성 제약 문서는 제약이 모듈을 추가하지 않고 버전 요구만 설정하며 기본으로 엄격하지 않고(보통 이 버전 이상), 전이 의존성 버전을 제어하는 데 쓴다고 한다. Maven 가이드는 같은 버전을 직접 선언하면 그 버전을 보장할 수 있다고 한다.
(실험 확인) Gradle 9.5.1에서 위 구조에 `d:1.0`을 직접 추가해도 `d:1.0 -> 2.0`으로 해석되었다. `strictly '1.0'`으로 바꾸면 직접 선언과 전이(2.0 -> 1.0)가 모두 1.0이 되었고, `constraints { implementation 'ex:d:3.0' }`는 모든 d를 3.0으로 올렸지만 `constraints { implementation 'ex:d:1.0' }`로는 2.0을 낮추지 못했다. Maven 동작은 실행하지 않았다.
