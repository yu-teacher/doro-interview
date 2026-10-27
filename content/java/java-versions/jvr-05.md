---
slug: "jvr-05"
topic: "java-versions"
tier: BASIC
difficulty: 1
title: "NullPointerException 메시지가 예전보다 자세해졌다는데 무엇이 달라졌나요?"
keywords: ["어느 표현식이 null인지 메시지에 포함", "Java 14의 JEP 358", "javac -g 이면 변수 이름 표시", "없으면 local 번호", "ShowCodeDetailsInExceptionMessages"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://openjdk.org/jeps/358", "https://www.oracle.com/java/technologies/javase/14-relnote-issues.html", "https://www.oracle.com/java/technologies/javase/15-relnote-issues.html", "https://docs.oracle.com/en/java/javase/25/docs/specs/man/java.html"]
concepts: [null-handling]
importance: 1
links: [{to: "jl-07", kind: RELATED}]
---
**모범 답변 (30~60초)**
Java 14의 JEP 358로, JVM이 NPE가 난 지점의 바이트코드를 분석해서 무엇이 null이었는지를 메시지에 넣어 줍니다. 예전에는 줄 번호만 있고 메시지가 비어 있었는데, 이제는 `Cannot invoke "String.length()" because "s" is null`처럼 어떤 동작이 어떤 변수·필드·메서드 반환값 때문에 실패했는지 알려 줍니다. 변수 이름은 `javac -g`로 컴파일해 로컬 변수 정보가 들어 있을 때만 나오고, 없으면 `<local1>`처럼 번호로 나옵니다. 처음 14에서는 옵션으로 켜야 했지만 15부터 기본으로 켜져 있습니다.

(공식 문서) JEP 358은 JVM이 바이트코드를 분석해 null이었던 부분을 설명하는 null-detail 메시지를 만들며, 로컬 변수 이름은 로컬 변수 테이블이 있으면 그 이름, 없으면 `<local i>` 형태로 쓴다고 한다. JEP는 이 메시지가 14에서 `-XX:+ShowCodeDetailsInExceptionMessages`로 켜야 하는 꺼진 상태이고 이후 릴리스에서 기본으로 켜겠다는 의도를 밝힌다. Oracle의 JDK 14 릴리스 노트는 이 옵션을 새로 소개하고, JDK 15 릴리스 노트는 이 플래그의 기본값이 `true`로 바뀌었다고 쓰며 메시지에 코드 조각이 들어가므로 애플리케이션 오류 메시지로 노출되면 원격 공격자에게 단서가 될 수 있다는 주의도 적는다. JDK 25 `java` 명령 문서도 기본 활성화라고 적는다.
(실험 확인) Corretto 25에서 `u.addr.city.length()`는 `Cannot read field "city" because "<local1>.addr" is null`, `arr[0]`은 `Cannot load from object array because "<local1>" is null`이었다. `-XX:-ShowCodeDetailsInExceptionMessages`를 주면 `getMessage()`가 `null`이었다. `String s = null; s.length()`는 `-g` 없이 `"<local1>"`, `-g`로 컴파일하면 `"s"`로 나왔다.
(실험 확인) Corretto 8.512와 11.0.33에서는 `s.length()`, `x.b.c.length()`, `arr[0] = 1` 세 NPE 모두 `getMessage()`가 `null`이었고(`-g` 컴파일 여부와 무관), `-XX:+ShowCodeDetailsInExceptionMessages`는 `Unrecognized VM option`이었다. Corretto 17.0.21과 21.0.13에서는 기본으로 `Cannot invoke "String.length()" because "<local1>" is null`, `Cannot read field "c" because "<local2>.b" is null`, `Cannot store to int array because "<local3>" is null`이 나왔고 `-g`를 주면 `"s"`, `"x.b"`, `"arr"`로 바뀌었다. `-XX:-ShowCodeDetailsInExceptionMessages`를 주면 17·21 모두 `null`이었다. 14에서 꺼져 있었고 15에서 기본이 켜졌다는 전환 시점은 JDK 14·15가 없어 직접 확인하지 못했고 릴리스 노트 서술에 의존한다.
