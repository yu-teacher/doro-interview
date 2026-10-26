---
slug: "jvr-16"
topic: "java-versions"
tier: DEEP
difficulty: 2
title: "Java 8 애플리케이션을 최신 JDK로 올릴 때 Oracle 마이그레이션 가이드는 어떤 순서로 점검하라고 하나요?"
keywords: ["먼저 재컴파일 없이 실행", "서드파티 라이브러리·빌드 도구 업그레이드", "--release 사용", "jdeps -jdkinternals", "jdeprscan --for-removal"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.oracle.com/en/java/javase/25/migrate/preparing-migration.html", "https://docs.oracle.com/en/java/javase/25/migrate/removed-apis.html", "https://openjdk.org/jeps/403"]
concepts: [jdk-migration]
importance: 2
links: [{to: "jvr-17", kind: FOLLOWUP}, {to: "jvr-19", kind: FOLLOWUP}, {to: "jvr-20", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
가이드는 먼저 새 JDK에서 기존 애플리케이션을 재컴파일 없이 그대로 실행해 보라고 합니다. 이때 폐기된 옵션 경고가 나오는지, 기동이 실패하면 제거된 GC 옵션 때문인지를 봅니다. 그다음에는 세 가지를 병행하라고 합니다. 서드파티 라이브러리와 Maven·Gradle, IDE를 새 JDK를 지원하는 버전으로 올리고, 필요하면 새 컴파일러로 `-source`/`-target` 대신 `--release`를 써서 컴파일하고, `jdeps -jdkinternals`로 JDK 내부 API 의존을 찾습니다. 제거 예정 API는 `jdeprscan`으로 확인합니다. jdeps는 정적 분석이라 리플렉션 호출은 잡지 못합니다.

(공식 문서) Preparing for Migration 페이지는 먼저 실행해 본 뒤 서드파티 라이브러리 업데이트, 컴파일, jdeps 실행 세 가지를 병행하라고 하고(마이그레이션은 반복 과정이라고 한다), 새 JDK 컴파일러로 컴파일하면 이후 이전이 쉬워지지만 꼭 필요하지는 않다고 쓰며, 날짜·통화 형식이 달라질 수 있어 로케일 데이터 변화에 유의하라고 한다. 같은 페이지는 jdeps가 정적 분석이라 리플렉션으로 내부 API를 부르면 경고하지 않는다고 적는다. Removed APIs 페이지는 `jdeprscan --release 25 -l --for-removal`로 제거 예정 API 목록을 볼 수 있다고 하고, JEP 403은 강한 캡슐화가 적용된 내부 요소에 반사로 접근하면 `InaccessibleObjectException`이 난다는 예를 보여 준다.
(실험 확인) `sun.misc.Unsafe` 사용, `String.class`의 private 필드 `setAccessible(true)`, `System.getSecurityManager()` 호출이 든 테스트 클래스에서 `jdeps -jdkinternals`는 `sun.misc.Unsafe`를 JDK 내부 API(jdk.unsupported)로 보고했고, `jdeprscan --release 25 --for-removal`은 `System::getSecurityManager (forRemoval=true)`를 보고했다. 실행하면 `Unsafe`는 접근됐지만 `String.value`는 `InaccessibleObjectException`이었고, `--add-opens java.base/java.lang=ALL-UNNAMED`를 주면 접근됐다.
(실험 확인) 재컴파일 없이 먼저 실행해 보라는 순서의 근거로, `String.class`의 private 필드 `value`를 `setAccessible(true)`하는 같은 클래스 파일을 Corretto 11.0.33에서 실행하면 `WARNING: An illegal reflective access operation has occurred` 경고만 내고 접근됐고, 17.0.21·21.0.13·25.0.4.1에서는 `InaccessibleObjectException: ... module java.base does not "opens java.lang" to unnamed module`이었다. 제거된 JVM 옵션이 기동 자체를 막는 예는 jvr-19에 있다.
