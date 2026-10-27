---
slug: "jvr-13"
topic: "java-versions"
tier: DEEP
difficulty: 2
title: "GC는 버전별로 어떻게 바뀌었나요? (기본 GC 변경, CMS 제거, ZGC·Shenandoah 정식화)"
keywords: ["Java 9에서 기본 GC가 G1", "CMS 14에서 제거", "ZGC·Shenandoah 15에서 프로덕션", "Generational ZGC 21·23·24", "작은 환경에서는 Serial 선택"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://openjdk.org/jeps/248", "https://openjdk.org/jeps/291", "https://openjdk.org/jeps/363", "https://openjdk.org/jeps/377", "https://openjdk.org/jeps/379", "https://openjdk.org/jeps/439", "https://openjdk.org/jeps/474", "https://openjdk.org/jeps/490", "https://openjdk.org/jeps/521", "https://openjdk.org/jeps/523", "https://openjdk.org/projects/jdk/27/", "https://docs.oracle.com/en/java/javase/25/migrate/migrating-jdk-8-later-jdk-releases.html"]
concepts: [garbage-collection]
importance: 2
links: [{to: "jv-09", kind: RELATED}, {to: "jv-10", kind: RELATED}]
---
**모범 답변 (30~60초)**
Java 8의 기본 GC는 Parallel이었고 Java 9에서 JEP 248로 서버 환경의 기본이 G1이 됐습니다. CMS는 9에서 deprecated, 14에서 제거됐습니다. ZGC와 Shenandoah는 15에서 실험 기능을 벗었고, ZGC는 21에서 세대별 모드가 생겨 23에서 기본이 되고 24에서 비세대 모드가 제거됐습니다. Shenandoah의 세대별 모드는 25에서 제품 기능이 됐습니다. 그리고 JDK 26까지는 기본이 늘 G1은 아니라서, CPU가 1개 이하이거나 메모리가 작은 환경에서는 Serial이 선택됩니다. 이 예외를 없애는 JEP 523은 JDK 27에 들어갔습니다.

(공식 문서) JEP 248은 서버 구성의 기본 GC를 G1으로 바꾸는 Release 9이고 Oracle 가이드도 JDK 8의 기본이 Parallel이었다고 쓴다. JEP 363은 CMS 제거 Release 14, JEP 291은 deprecated 9다. JEP 377과 379는 Release 15, JEP 439는 21, JEP 474는 23, JEP 490은 24, JEP 521은 25다. JEP 523은 Release 27(Closed / Delivered)이고, JDK 27 프로젝트 페이지는 2026-09-15에 GA라고 쓴다. 이 JEP는 JDK 9 이후 JVM이 CPU 1개 이하 또는 물리 메모리 1792MB 미만에서 Serial을 고르게 했다고 설명한다.
(실험 확인) Corretto 25.0.3에서 `-Xlog:gc`로 확인하니 기본은 `Using G1`, `-XX:ActiveProcessorCount=1`을 주면 `Using Serial`, 2를 주면 G1이었다. `-XX:+UseZGC`와 `-XX:+UseShenandoahGC`는 별도 해제 옵션 없이 선택됐다. `-XX:+UseConcMarkSweepGC`는 `Unrecognized VM option` 오류였고, `-XX:-ZGenerational`은 `Ignoring option ZGenerational; support was removed in 24.0` 경고였다. JDK 27은 설치되어 있지 않아 JEP 523의 동작은 실행하지 않았다.
(실험 확인) `-XX:+PrintFlagsFinal`로 기본 GC를 보면 Corretto 8.512는 `UseParallelGC := true`, 11.0.33·17.0.21·21.0.13·25.0.4.1은 `UseG1GC = true`(ergonomic)였다. `-XX:ActiveProcessorCount=1`을 주면 11·17·21·25 모두 `UseSerialGC = true`(ergonomic)로 바뀌었고, 컨테이너 메모리를 1GB로 제한해도 21.0.13이 Serial을 골랐다(이 G1 결과는 CPU·메모리가 넉넉한 실험 환경 기준이다). `-XX:+UseConcMarkSweepGC`는 8.512에서 아무 경고 없이 기동했고, 11.0.33에서는 `Option UseConcMarkSweepGC was deprecated in version 9.0` 경고와 함께 기동했으며 17.0.21부터 `Unrecognized VM option`이었다. 21.0.13에서 `-XX:+UseZGC`는 `Using legacy single-generation mode`였고 `-XX:+ZGenerational`을 더해야 세대형이었으며, 17.0.21은 `-XX:+UseZGC`는 받았지만 `ZGenerational`은 인식하지 못했다. Corretto 17.0.21과 25.0.4.1에서 `-XX:+UseShenandoahGC`가 `Using Shenandoah`로 선택됐고(Corretto 11.0.33도 해제 옵션 없이 선택됐다. 15 이전 버전의 포함 여부는 공급사 빌드마다 다를 수 있다), 25.0.4.1은 `-XX:ShenandoahGCMode=generational`도 오류 없이 선택했다.
