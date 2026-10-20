---
slug: "bld-05"
topic: "dev-build"
tier: BASIC
difficulty: 1
title: "전이 의존성(transitive dependency)이란 무엇이고, 어떻게 확인하나요?"
keywords: ["의존성의 의존성", "자동으로 포함", "의존성 트리 확인", "직접 쓰는 라이브러리는 직접 선언"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://maven.apache.org/guides/introduction/introduction-to-dependency-mechanism.html", "https://docs.gradle.org/current/userguide/graph_resolution.html", "https://docs.gradle.org/current/userguide/java_library_plugin.html"]
concepts: [dependency-management]
importance: 3
links: [{to: "bld-12", kind: FOLLOWUP}, {to: "bld-01", kind: PREREQ}]
---
**모범 답변 (30~60초)**
전이 의존성은 내가 선언한 라이브러리가 다시 필요로 하는 라이브러리를 말합니다. Maven과 Gradle 모두 라이브러리의 POM 같은 메타데이터를 읽어 이런 의존성을 자동으로 끌어오기 때문에 일일이 찾아 적지 않아도 됩니다. 다만 그래프가 금방 커지고 버전이 겹치면 충돌도 생기므로, 무엇이 들어왔는지는 Gradle에서 `dependencies` task, Maven에서 `mvn dependency:tree`로 확인합니다. 또 소스에서 직접 쓰는 라이브러리는 전이로 들어오는 것에 기대지 말고 직접 선언하는 것이 안전합니다.

```text
$ gradle dependencies --configuration runtimeClasspath
runtimeClasspath
+--- ex:b:1.0
|    \--- ex:c:1.0
|         \--- ex:d:2.0
\--- ex:e:1.0
     \--- ex:d:1.0 -> 2.0
```

(공식 문서) Maven 의존성 메커니즘 가이드는 전이 의존성을 자동으로 포함하며 깊이 제한 없이 모으고, 순환 의존만 문제라고 설명한다. 소스가 직접 쓰는 의존성은 명시적으로 선언하는 것이 모범 사례이고(중간 라이브러리가 의존을 바꾸면 빌드가 깨질 수 있다), `mvn dependency:tree`로 볼 수 있으며 `dependency:analyze` 목표가 이를 돕는다고 한다. Gradle 문서는 `implementation`이 의존성을 소비자의 컴파일 클래스패스에 노출하지 않아 전이 의존성에 실수로 기대는 일을 막는다고 한다.
(실험 확인) 로컬 파일 저장소에 만든 가짜 모듈로 b가 c를, c가 d 2.0을, e가 d 1.0을 의존하게 하고 Gradle 9.5.1에서 출력한 트리가 위와 같다. `d:1.0 -> 2.0`은 요청한 1.0 대신 2.0이 선택되었다는 표시다. `mvn dependency:tree`는 Maven이 없어 실행하지 않았다.
