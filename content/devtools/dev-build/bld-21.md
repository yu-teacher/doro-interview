---
slug: "bld-21"
topic: "dev-build"
tier: DEEP
difficulty: 2
title: "Gradle의 UP-TO-DATE 검사, 빌드 캐시, 데몬은 각각 무엇이고 어떻게 다른가요?"
keywords: ["입출력이 같으면 UP-TO-DATE", "빌드 캐시로 결과 재사용", "데몬은 JVM 상주", "빌드 캐시는 기본 꺼짐"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.gradle.org/current/userguide/incremental_build.html", "https://docs.gradle.org/current/userguide/build_cache.html", "https://docs.gradle.org/current/userguide/gradle_daemon.html"]
---
**모범 답변 (30~60초)**
세 가지 모두 빌드를 빠르게 하지만 층위가 다릅니다. UP-TO-DATE 검사, 즉 증분 빌드는 task의 입력과 출력이 지난 실행 이후 바뀌지 않았으면 그 task를 건너뛰는 것입니다. 빌드 캐시는 한 걸음 더 나아가 같은 입력으로 만든 task 출력을 다른 빌드나 다른 위치, 원격 캐시를 쓰면 다른 PC의 결과에서도 가져와 재사용하며 기본으로는 꺼져 있습니다. 데몬은 빌드가 끝나도 살아 있는 장기 실행 JVM 프로세스로, JVM 시작 비용을 줄이고 정보를 메모리에 유지하며 Gradle 3.0부터 기본으로 켜져 있습니다.

```text
$ gradle build                          # 두 번째 실행
> Task :compileJava UP-TO-DATE
$ gradle clean build --build-cache      # 캐시에 결과가 있을 때
> Task :compileJava FROM-CACHE
```

(공식 문서) 증분 빌드 문서는 task의 입력과 출력이 바뀌지 않았으면 task를 최신 상태로 보고 동작을 건너뛰며, 입출력을 Gradle에 알려야 한다고 한다. 빌드 캐시 문서는 캐시가 기본으로 꺼져 있고 `--build-cache` 또는 `org.gradle.caching=true`로 켜며, 이전 빌드의 출력을 위치와 컴퓨터를 넘어 재사용한다고 한다. 데몬 문서는 데몬이 빌드를 실행하는 장기 실행 프로세스로 JVM 시작 오버헤드를 없애고, 3시간 동안 유휴이면 자동 종료된다고 한다.
(실험 확인) Gradle 9.5.1 임시 프로젝트에서 두 번째 `build`가 UP-TO-DATE였고, 캐시 디렉터리를 프로젝트 안으로 지정해 `--build-cache`로 빌드한 뒤 `clean`하고 다시 빌드하면 `compileJava`가 FROM-CACHE였다. 데몬은 실행 환경에 영향을 줄 수 있어(`--stop`이 같은 버전의 모든 데몬을 종료한다) 실험하지 않았다.
