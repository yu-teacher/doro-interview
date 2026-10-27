---
slug: "jvr-19"
topic: "java-versions"
tier: TRICKY
difficulty: 3
title: "Java 8 시절의 JVM 옵션을 그대로 두고 새 JDK로 올리면 어떻게 되나요?"
keywords: ["제거된 옵션은 기동 실패", "MaxPermSize·CMS·BiasedLocking", "-Xloggc는 통합 로깅으로 대체", "--illegal-access는 경고만", "서버 기동 전에 옵션 점검"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.oracle.com/en/java/javase/25/migrate/migrating-jdk-8-later-jdk-releases.html", "https://openjdk.org/jeps/363", "https://docs.oracle.com/en/java/javase/25/docs/specs/man/java.html", "https://docs.oracle.com/en/java/javase/17/docs/specs/man/java.html"]
concepts: [jdk-migration, garbage-collection]
importance: 1
links: [{to: "jvr-16", kind: PREREQ}, {to: "jvr-13", kind: PREREQ}, {to: "jv-11", kind: RELATED}]
---
**모범 답변 (30~60초)**
옵션마다 다릅니다. 제거된 옵션은 JVM이 아예 뜨지 않을 수 있습니다. JDK 21, 24, 25에서 `-XX:MaxPermSize`, `-XX:+UseConcMarkSweepGC`, `-XX:+UseBiasedLocking`은 `Unrecognized VM option` 오류로 기동에 실패했습니다. 반면 `-Xloggc`와 `-XX:+PrintGCDetails`는 deprecated 경고를 내고 통합 로깅 `-Xlog`로 바꿔서 동작하고, `--illegal-access`는 17부터 경고만 내고 무시됩니다. 그래서 JDK를 올릴 때는 컨테이너 실행 스크립트나 `JAVA_OPTS`의 옵션을 먼저 새 JDK에서 한 번 돌려 확인해야 합니다.

(공식 문서) Oracle 마이그레이션 가이드는 폐기된 옵션 경고를 보고 제거된 GC 옵션을 확인하라고 하고, 제거된 GC 옵션에 CMS 관련 플래그(`-Xincgc`, `-XX:+CMSIncrementalMode` 등)를 나열하며, 영구 세대 옵션 `-XX:MaxPermSize`는 JDK 9 이상에서 `Ignoring option MaxPermSize; support was removed in 8.0` 경고만 낸다고 쓴다. `-XX:+PrintGCDetails`는 deprecated이고 GC 로그는 통합 로깅의 `gc` 태그(`-Xlog:gc`)를 쓰라고 하며, `--illegal-access`는 17에서 경고 외에 효과가 없다고 한다. JEP 363은 CMS를 14에서 제거했다. `java` 명령 문서는 제거된 옵션을 쓰면 `Unrecognized VM option` 오류가 난다고 설명하고, JDK 17판 문서는 `-XX:MaxPermSize`를 JDK 17에서 제거된 옵션으로 나열한다.
(실험 확인) Corretto 21.0.11, 24.0.2, 25.0.3 모두에서 `-XX:MaxPermSize=64m`는 가이드 문장과 달리 `Unrecognized VM option` 오류로 기동에 실패했다. `-XX:+UseConcMarkSweepGC`, `-XX:+UseBiasedLocking`, 25에서는 `-XX:+UseParNewGC`, `-XX:+AggressiveOpts`, `-Djava.ext.dirs`, `-Djava.endorsed.dirs`도 실패했다. `-Xloggc:gc.log`와 `-XX:+PrintGCDetails`는 세 버전 모두 `deprecated` 경고와 함께 통합 로깅으로 바뀌었고, `--illegal-access=permit`은 `support was removed in 17.0` 경고만 냈으며 25에서는 둘 다 프로그램이 실행됐다. `-XX:+IgnoreUnrecognizedVMOptions`를 같이 주면 위 제거 옵션이 있어도 JVM이 떴지만, 이 옵션의 의미는 읽은 자료에서 확인하지 않았다.
(실험 확인) 버전별로 직접 실행하면, `-XX:MaxPermSize=64m`는 Corretto 8.512에서 `ignoring option MaxPermSize=64m; support was removed in 8.0` 경고만 내고 기동했고, 11.0.33에서도 `Ignoring option MaxPermSize; support was removed in 8.0` 경고 후 기동해 가이드 서술과 일치했으며, 17.0.21부터 `Unrecognized VM option` 오류였다. `-XX:+UseConcMarkSweepGC`는 8.512 정상, 11.0.33 `was deprecated in version 9.0` 경고 후 기동, 17.0.21 오류였다. `-XX:+UseBiasedLocking`은 8.512·11.0.33 정상, 17.0.21 `was deprecated in version 15.0` 경고 후 기동, 21.0.13부터 오류였다. `-XX:+PrintGCDetails`는 8.512 정상, 11·17·21에서 `is deprecated. Will use -Xlog:gc* instead.` 경고였다. `--illegal-access=permit`은 8.512에서 `Unrecognized option` 오류, 11.0.33에서 조용히 수용, 17.0.21 이상에서 무시 경고였다.
