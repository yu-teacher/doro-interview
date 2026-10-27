---
slug: "jvr-11"
topic: "java-versions"
tier: DEEP
difficulty: 2
title: "Java 17에서 21로 올리면 무엇이 정식 기능이 되나요?"
keywords: ["switch 패턴 매칭·record 패턴", "가상 스레드", "순차 컬렉션", "Generational ZGC", "UTF-8 기본·finalization 제거 예정"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://openjdk.org/jeps/441", "https://openjdk.org/jeps/440", "https://openjdk.org/jeps/444", "https://openjdk.org/jeps/431", "https://openjdk.org/jeps/439", "https://openjdk.org/jeps/400", "https://openjdk.org/jeps/421", "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/List.html"]
concepts: [virtual-thread, modern-java]
importance: 2
links: [{to: "jvr-12", kind: FOLLOWUP}, {to: "jt-15", kind: RELATED}, {to: "jc-14", kind: RELATED}, {to: "jo-12", kind: RELATED}]
---
**모범 답변 (30~60초)**
Java 21에서 switch 패턴 매칭(JEP 441), record 패턴(JEP 440), 가상 스레드(JEP 444), 순차 컬렉션(JEP 431)이 정식이 됩니다. 가상 스레드는 19와 20의 프리뷰를 거쳤고, 순차 컬렉션으로 `List.reversed()` 같은 메서드가 생겼습니다. GC에서는 Generational ZGC(JEP 439)가 추가됩니다. 17과 21 사이인 18에서는 기본 문자셋이 UTF-8로 바뀌었고(JEP 400), 파이널라이제이션이 제거 예정이 되었습니다(JEP 421). 특히 기본 문자셋은 파일 읽기·쓰기 동작에 영향을 줄 수 있어서 업그레이드 때 확인해야 합니다.

(공식 문서) JEP 441, 440, 444, 431, 439는 모두 Release 21이다. JEP 444는 가상 스레드가 JEP 425(JDK 19)와 JEP 436(JDK 20)의 프리뷰를 거쳤다고 쓴다. JEP 400은 기본 문자셋을 UTF-8로 하되 이전 동작으로 되돌리는 방법이 항상 있을 것이라고 하며 Release 18이고, JEP 421은 Release 18에서 파이널라이제이션을 제거 예정으로 표시했다. `List.reversed()`의 Javadoc Since는 21이다.
(실험 확인) JDK 25의 `javac --release 17`은 패턴 switch, record 패턴, `reversed()`를 모두 컴파일하지 못했고 `--release 21`은 모두 성공했다. 가상 스레드 `Thread.ofVirtual()`은 `--release 20`에서는 `is a preview API` 오류, 21에서는 성공이었다.
(실험 확인) Corretto 17.0.21은 패턴 switch를 `patterns in switch statements are a preview feature and are disabled by default`, record 패턴을 `')' expected`, `List.reversed()`와 `Thread.ofVirtual()`을 `cannot find symbol`로 거부했다. Corretto 21.0.13에서는 모두 컴파일·실행되어 `bigintstrother`, `3`, `[3, 2, 1]`, `virtual=true`를 출력했다. 21.0.13에서 `-XX:+UseZGC`는 로그에 `Using legacy single-generation mode`가 찍혔고 `-XX:+ZGenerational`을 주면 그 줄이 없었다(세대형). 17.0.21은 `-XX:+ZGenerational`을 `Unrecognized VM option`으로 거부했다. 파이널라이제이션은 21.0.13에서 기본으로 `finalize()`가 실행됐고(`ran=true`) `--finalization=disabled`를 주면 실행되지 않았으며(`ran=false`), 17.0.21은 이 옵션을 인식하지 못했다. 기본 문자셋은 `LC_ALL=C`에서 17.0.21이 US-ASCII, 21.0.13이 UTF-8이었다.
