---
slug: "jvr-03"
topic: "java-versions"
tier: BASIC
difficulty: 1
title: "`List.of`, `Optional.ifPresentOrElse`, `String.isBlank`, `Files.readString`, `HttpClient`는 각각 어느 자바 버전부터 쓸 수 있나요?"
keywords: ["List.of·ifPresentOrElse는 9", "copyOf·toUnmodifiableList는 10", "isBlank·readString은 11", "HttpClient는 11에서 표준", "API 문서의 Since"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/List.html", "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/Optional.html", "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/String.html", "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/nio/file/Files.html", "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/stream/Collectors.html", "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/stream/Stream.html", "https://docs.oracle.com/en/java/javase/25/docs/api/java.net.http/java/net/http/HttpClient.html", "https://openjdk.org/jeps/321", "https://openjdk.org/jeps/323"]
concepts: [java-release-lts, java-collections]
importance: 2
links: [{to: "jc-06", kind: RELATED}, {to: "js-15", kind: RELATED}]
---
**모범 답변 (30~60초)**
`List.of`, `Optional.ifPresentOrElse`, `Stream.takeWhile`은 Java 9, `List.copyOf`와 `Collectors.toUnmodifiableList`는 Java 10, `String.isBlank`, `strip`, `repeat`, `lines`와 `Files.readString`, `Optional.isEmpty`는 Java 11부터입니다. `java.net.http.HttpClient`도 11에서 표준 API가 됐는데, 9와 10에서는 인큐베이터 모듈로 있던 것입니다. 문법으로는 10의 `var`, 11의 람다 매개변수 `var`가 있습니다. 외우기보다, Java 8 기준으로 컴파일하다 `cannot find symbol`이 나면 API 문서의 Since 항목을 확인하는 습관이 중요합니다.

(공식 문서) JDK 25 Javadoc의 Since 값은 `List.of` 9, `List.copyOf` 10, `Optional.ifPresentOrElse` 9, `Optional.isEmpty` 11, `Stream.takeWhile` 9, `Collectors.toUnmodifiableList` 10, `Files.readString` 11이다. JEP 321은 JDK 9에서 JEP 110으로 들어온 인큐베이터 HTTP 클라이언트를 JDK 11에서 표준화한다고 하고, JEP 323은 람다 매개변수에 `var`를 허용하며 Release 11이다. `String`의 `isBlank`·`strip`·`repeat`·`lines`는 Javadoc에서 Since 11로 확인했다.
(실험 확인) Corretto 8.512의 `javac`는 `List.of`, `List.copyOf`, `Optional.ifPresentOrElse`, `Optional.isEmpty`, `Stream.takeWhile`, `Collectors.toUnmodifiableList`, `String.isBlank`·`repeat`·`strip`, `Files.readString`·`Path.of`, `var`를 모두 `cannot find symbol` 계열 오류로 거부했고 `HttpClient`는 `package java.net.http does not exist`였다. Corretto 11.0.33에서는 이것들과 람다 매개변수 `var`(`(var x, var y) -> x + y`)가 모두 컴파일·실행됐고 `HttpClient.newHttpClient().version()`은 `HTTP_2`를 출력했다. 17.0.21·21.0.13·25.0.4.1도 같았다. 9와 10 사이의 경계는 해당 JDK가 없어 JDK 25의 `javac --release N`으로만 확인했다. `List.copyOf`는 8·9 실패, 10부터 성공. `Optional.ifPresentOrElse`와 `Stream.takeWhile`, `Runtime.version`은 9부터 성공. `String.isBlank`, `Files.readString`, `Optional.isEmpty`, `HttpClient`는 10까지 실패하고 11부터 성공했다.
