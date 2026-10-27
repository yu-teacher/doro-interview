---
slug: "jvr-18"
topic: "java-versions"
tier: TRICKY
difficulty: 3
title: "Java 18부터 기본 문자셋이 UTF-8이라는데, 이제 인코딩 문제는 신경 쓰지 않아도 되나요?"
keywords: ["Charset.defaultCharset()이 UTF-8", "콘솔 I/O는 예외", "stdout.encoding과 native.encoding", "javac -encoding", "-Dfile.encoding=COMPAT"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://openjdk.org/jeps/400", "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/System.html", "https://docs.oracle.com/en/java/javase/25/migrate/migrating-jdk-8-later-jdk-releases.html"]
concepts: [jdk-migration]
importance: 1
---
**모범 답변 (30~60초)**
아닙니다. JEP 400으로 Java 18부터 `Charset.defaultCharset()`이 OS나 로케일과 무관하게 UTF-8이라서 `FileReader`, `FileWriter` 같은 API의 동작이 어디서나 같아졌습니다. 하지만 콘솔 입출력은 예외입니다. `System.out`은 `stdout.encoding`을 따르고 이 값은 환경에 따라 다릅니다. C 로케일에서는 기본 문자셋이 UTF-8이어도 콘솔 인코딩은 US-ASCII였습니다. 또 `javac`도 소스 파일 인코딩을 기본 문자셋으로 가정하므로 UTF-8이 아닌 소스는 `-encoding`을 지정해야 합니다. 이전 동작은 `-Dfile.encoding=COMPAT`로 되돌릴 수 있습니다.

(공식 문서) JEP 400은 기본 문자셋을 UTF-8로 표준화하되 콘솔 입출력은 제외한다고 하고, `System.out`·`System.err`는 `Console.charset()`을 따른다고 한다. `System` Javadoc은 `stdout.encoding`을 `System.out`의 문자 인코딩 이름으로 설명한다. `-Dfile.encoding=COMPAT`는 JDK 17 이전의 환경 기반 선택을 되살리고 `native.encoding`은 그 값을 알려 준다. javac가 소스를 읽을 때도 기본 문자셋을 가정하므로 비UTF-8 소스는 `-encoding`이 필요하고, `Charset.forName("default")`는 예외를 던지게 바뀐다고 한다. Oracle 마이그레이션 가이드는 `-Dfile.encoding=UTF-8`을 기존 JDK에서 미리 시험하라고 권한다.
(실험 확인) Corretto 25에서 `LC_ALL=C`로 실행하면 `default=UTF-8`, `native.encoding=US-ASCII`, `stdout.encoding=US-ASCII`였고 `FileWriter`로 쓴 `한글`은 6바이트였다. `-Dfile.encoding=COMPAT`를 주면 `default=US-ASCII`가 되고 같은 코드가 2바이트만 기록해 내용이 손실됐다. `Charset.forName("default")`는 `UnsupportedCharsetException`이었다.
(실험 확인) 같은 코드를 `LC_ALL=C`로 실행하면 Corretto 8.512와 11.0.33, 17.0.21은 `Charset.defaultCharset()`이 US-ASCII(`file.encoding=ANSI_X3.4-1968`)였고 `한글`이 2바이트만 기록됐다. 21.0.13과 25.0.4.1은 UTF-8이고 6바이트였으며 `native.encoding`과 `stdout.encoding`은 `ANSI_X3.4-1968`이었다(`Charset.forName`으로 풀면 US-ASCII). `native.encoding` 시스템 프로퍼티는 8.512와 11.0.33에서 `null`, 17.0.21에서 값이 있었고 `stdout.encoding`은 17.0.21까지 `null`, 21부터 값이 있었다. `LC_ALL=C.UTF-8`에서는 모든 버전이 UTF-8이었다.
