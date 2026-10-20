---
slug: "bld-20"
topic: "dev-build"
tier: TRICKY
difficulty: 3
title: "동적 버전(`2.+`)과 SNAPSHOT은 재현 가능한 빌드를 어떻게 해치고, 의존성 잠금(dependency locking)으로 해결되나요?"
keywords: ["동적 버전은 해석 결과가 바뀜", "gradle.lockfile", "SNAPSHOT은 잠금 대상이 아님", "--update-locks로 갱신"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.gradle.org/current/userguide/dependency_locking.html", "https://docs.gradle.org/current/userguide/dependency_versions.html", "https://docs.gradle.org/current/userguide/dependency_caching.html"]
concepts: [dependency-management]
importance: 1
links: [{to: "bld-07", kind: PREREQ}]
---
**모범 답변 (30~60초)**
`2.+` 같은 동적 버전은 빌드할 때마다 저장소에서 그 시점의 최신 매칭 버전으로 해석되므로, 같은 소스인데 어느 날 갑자기 다른 버전이 들어와 빌드가 깨질 수 있습니다. 의존성 잠금은 해석된 버전을 `gradle.lockfile`에 저장해 이후 빌드가 같은 버전을 쓰게 하고, 새 버전이 나와도 잠금 상태가 바뀌지 않는 한 그대로입니다. 올릴 때는 `--update-locks`로 갱신합니다. 다만 같은 좌표인데 내용이 바뀌는 SNAPSHOT 같은 changing 버전에는 잠금을 쓰지 말라고 문서가 경고하니 구분해야 합니다.

```groovy
dependencyLocking { lockAllConfigurations() }
dependencies { implementation 'ex:d:2.+' }
// gradle dependencies --write-locks  -> gradle.lockfile: ex:d:2.0=compileClasspath,runtimeClasspath,...
// 저장소에 d:2.1 추가 후 일반 빌드      -> ex:d:2.+ -> 2.0  (잠금 유지)
// gradle dependencies --update-locks ex:d -> ex:d:2.+ -> 2.1
```

(공식 문서) 의존성 잠금 문서는 동적 버전이 시간에 따라 해석 결과가 바뀌어 빌드가 깨질 수 있고, 잠금은 해석된 버전을 파일에 저장해 재현 가능한 빌드를 돕는다고 한다. 잠금 상태는 프로젝트 루트의 `gradle.lockfile`에 저장되고(문서는 9.8.2 기준이며 옛 형식 잠금 파일에서 이전하는 안내가 따로 있다) 버전 관리에 올려야 하며, `--write-locks`로 생성·갱신하고 `--update-locks`로 일부 모듈만 갱신한다. SNAPSHOT 같은 changing 버전에는 잠금을 쓰면 안 되고 쓰면 경고한다고 한다.
(실험 확인) Gradle 9.5.1에서 `maven-metadata.xml`을 둔 로컬 파일 저장소로 위 시나리오를 재현했다. 처음 잠금 시 `gradle.lockfile`에 `ex:d:2.0=compileClasspath`가 적혔고, 2.1을 추가한 뒤에도 일반 빌드는 2.0으로 해석되었으며, `--update-locks ex:d` 후에는 2.1로 갱신되었다. 잠금 없이 두면 2.1로 해석되었다. SNAPSHOT(`1.0-SNAPSHOT`) 모듈을 같은 방식으로 잠그니 `gradle.lockfile`은 만들어졌지만 "changing modules"를 포함한다는 경고가 출력되었다.
