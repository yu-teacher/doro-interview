---
slug: "jvr-02"
topic: "java-versions"
tier: BASIC
difficulty: 1
title: "Java 8은 왜 자바 역사의 전환점이라고 하고, 어떤 기능이 들어왔나요?"
keywords: ["람다식과 메서드 참조", "스트림 API", "default 메서드", "java.time 날짜·시간 API", "Optional"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://www.oracle.com/java/technologies/javase/8-whats-new.html", "https://docs.oracle.com/javase/8/docs/technotes/guides/language/enhancements.html", "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/Optional.html", "https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-3.0-Migration-Guide"]
concepts: [lambda-stream, java-release-lts]
importance: 3
links: [{to: "jvr-03", kind: FOLLOWUP}, {to: "js-01", kind: RELATED}, {to: "js-15", kind: RELATED}]
---
**모범 답변 (30~60초)**
Java 8은 람다식, 메서드 참조, 인터페이스의 default 메서드, 스트림 API, 새 날짜·시간 API인 `java.time`, 그리고 `Optional`이 한꺼번에 들어온 릴리스입니다. 람다와 스트림으로 컬렉션을 함수형 스타일로 처리하게 됐고, default 메서드는 기존 인터페이스에 새 메서드를 추가해도 옛 코드와의 바이너리 호환성을 지키게 해 줍니다. 그래서 이후 자바 코드의 모양이 크게 바뀌었습니다. 지금도 Java 8을 쓰는 프로젝트가 있지만 Spring Boot 3.0부터는 Java 17 이상이 필요해서 8은 지원되지 않습니다.

(공식 문서) Oracle의 What's New in JDK 8은 람다식, 메서드 참조, default 메서드, 반복 애노테이션, 타입 애노테이션, 개선된 타입 추론, `java.util.stream` 패키지의 Stream API, 새 날짜·시간 패키지(Date-Time Package), Nashorn 엔진을 항목으로 나열하고, 언어 개선 페이지는 default 메서드가 옛 버전용 코드와의 바이너리 호환성을 보장하면서 라이브러리 인터페이스에 기능을 추가하게 해 준다고 설명한다. `Optional`의 Javadoc에는 Since 1.8이 적혀 있다. Spring Boot 3.0 마이그레이션 가이드는 Java 17 이상이 필요하고 Java 8은 더 이상 지원되지 않는다고 쓴다.
(보충) Java 8을 전환점으로 보는 평가와 이후 코드 모양이 크게 바뀌었다는 서술은 공식 문서의 문장이 아니라 일반적인 평가다.
(실험 확인) Corretto 8.512의 `javac`로 람다, 스트림(`map`/`collect`), `Optional`, `LocalDate`, 인터페이스 default·static 메서드를 쓴 코드가 컴파일·실행됐고 `lam`, `[2, 4, 6]`을 출력했다. 같은 8.512에서 `var`, `List.of`, `record`는 `cannot find symbol` 오류였다(`record P(int x){}`는 `symbol: class record`). Corretto 11.0.33에서는 `var`와 `List.of`가 성공하고 `record`만 실패했으며, 17.0.21에서 `record`가 성공했다.
