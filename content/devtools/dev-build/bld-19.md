---
slug: "bld-19"
topic: "dev-build"
tier: TRICKY
difficulty: 3
title: "Gradle 빌드 스크립트에서 task 본문에 `doLast` 없이 `println`이나 로직을 쓰면 어떤 일이 생기나요?"
keywords: ["구성 단계에 실행", "doLast는 실행 단계", "요청하지 않은 task도 구성", "tasks.register로 지연 등록"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.gradle.org/current/userguide/build_lifecycle.html"]
concepts: [build-tool]
importance: 1
links: [{to: "bld-08", kind: PREREQ}]
---
**모범 답변 (30~60초)**
task 선언 블록에 곧바로 쓴 코드는 task를 실행할 때가 아니라 구성 단계에서 실행됩니다. 실행 단계에서 도는 것은 `doFirst`나 `doLast` 안의 코드뿐입니다. 그래서 `build.gradle` 최상위의 `println`이나, `task name { }`처럼 즉시 만드는 task의 블록 안에 바로 쓴 로직은 그 task를 실행하지 않는 빌드에서도 매번 돕니다. 그러니 파일 생성 같은 실제 작업은 `doLast` 안에 넣어야 합니다. 문서 예시에서는 `tasks.register`로 등록한 task가 요청되지 않으면 구성되지 않으므로, 불필요한 구성을 피하려면 `register`를 씁니다.

```text
task eagerTask { println 'eagerTask body' ... }               // 즉시 생성
tasks.register('lazyTask') { println 'lazyTask body' ... }   // 지연 등록
$ gradle other       -> 'top-level println', 'eagerTask body', 'other (exec)'
$ gradle lazyTask    -> 'top-level println', 'eagerTask body', 'lazyTask body', 'lazyTask doLast (exec)'
```

(공식 문서) Build Lifecycle 문서는 task 블록의 코드가 구성 단계에 실행되고 `doFirst`·`doLast`가 실행 단계라는 예시를 보여 주며, `tasks.register`로 등록한 `configured` task는 Gradle이 요청된 task와 선행 task만 구성하므로 구성되지 않는다고 설명한다.
(실험 확인) Gradle 9.5.1에서 `task eagerTask { println ... }`로 즉시 만든 task의 본문은 다른 task인 `other`만 요청해도 실행되었고, `tasks.register('lazyTask') { println ... }`의 본문은 그 task를 요청했을 때만 실행되었다. 빌드 시간이 얼마나 느려지는지는 측정하지 않았다.
