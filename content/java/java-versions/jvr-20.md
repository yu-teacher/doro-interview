---
slug: "jvr-20"
topic: "java-versions"
tier: TRICKY
difficulty: 3
title: "`java.version`을 `1.8`처럼 파싱하던 코드는 새 JDK에서 어떻게 되나요?"
keywords: ["Java 9부터 새 버전 문자열", "1.8.0에서 25.0.3으로", "Runtime.version().feature()", "Runtime.Version.parse", "$FEATURE.$INTERIM.$UPDATE.$PATCH"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://openjdk.org/jeps/223", "https://openjdk.org/jeps/322", "https://docs.oracle.com/en/java/javase/25/migrate/migrating-jdk-8-later-jdk-releases.html", "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Runtime.html"]
concepts: [jdk-migration]
importance: 1
links: [{to: "jvr-16", kind: PREREQ}]
---
**모범 답변 (30~60초)**
Java 8까지는 버전이 `1.8.0_292`처럼 `1.`로 시작했지만 Java 9부터는 `11.0.2`, `25.0.3`처럼 바뀌었습니다(JEP 223). 그래서 `startsWith("1.8")`로 Java 8 여부를 판단하거나 `split("\\.")[1]`을 메이저 버전으로 읽던 코드는 새 JDK에서 오동작합니다. 25.0.3에서 `[1]`은 `0`입니다. 대신 Java 9에서 추가된 `Runtime.version()`의 `feature()`로 메이저 버전을 얻고, 버전 문자열 형식은 `$FEATURE.$INTERIM.$UPDATE.$PATCH`입니다. 다만 `Runtime.Version.parse("1.8.0_292")`는 예외를 던져서 옛 형식 문자열은 따로 처리해야 합니다.

(공식 문서) JEP 223은 Release 9에서 새 버전 문자열 체계를 도입하고, JEP 322는 이를 시간 기반 릴리스에 맞춰 `$FEATURE`가 6개월마다 증가하는 형태로 고쳤다. Oracle 마이그레이션 가이드는 JDK 11 이후에도 JDK 10의 형식을 유지하며 버전 형식에 의존하는 코드는 고쳐야 할 수 있고, 파싱·검증·비교용 API로 `java.lang.Runtime.Version`이 추가되었다고 쓴다. `Runtime.version()`의 Javadoc Since는 9다.
(실험 확인) Corretto 25.0.3에서 `java.version`은 `25.0.3`, `feature()=25`, `update()=3`이었다. `"25.0.3".startsWith("1.8")`은 false, `split("\\.")[1]`은 `0`이었다. `Runtime.Version.parse`는 `8.0.292`, `11.0.2`, `21.0.5+11-LTS`를 받았고 `1.8.0_292`는 `IllegalArgumentException: Invalid version string`이었다. Corretto 8.512에서는 `java.version=1.8.0_512`, `java.specification.version=1.8`, `split("\\.")[1]`이 `8`, `startsWith("1.8")`가 true였고 `java.lang.Runtime$Version` 클래스가 없었다(`Runtime.version()` 컴파일 불가). 11.0.33, 17.0.21, 21.0.13에서는 `feature()`가 각각 11, 17, 21이고 `optional()`이 `Optional[LTS]`였으며 `split("\\.")[1]`은 모두 `0`이었다. 25.0.4.1은 버전이 `25.0.4.1`로 네 자리였고 `feature()`는 25였다. `Runtime.Version.parse("1.8.0_292")`는 11·17·21·25 모두 `IllegalArgumentException: Invalid version string`이었고 `8.0.292`는 파싱됐다.
