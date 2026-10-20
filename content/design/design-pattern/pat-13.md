---
slug: "pat-13"
topic: "design-pattern"
tier: BASIC
difficulty: 1
title: "데코레이터 패턴은 무엇이고, `java.io`나 `Collections`의 래퍼는 어떤 예인가요?"
keywords: ["같은 인터페이스로 감쌈", "호출을 위임하며 기능 추가", "여러 겹 중첩", "래퍼", "TaskDecorator"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/io/FilterInputStream.html", "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/Collections.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/core/task/TaskDecorator.html", "https://gameprogrammingpatterns.com/service-locator.html"]
---
**모범 답변 (30~60초)**
데코레이터는 대상과 같은 인터페이스를 구현하는 래퍼가 대상 객체를 감싸 두고, 호출을 위임하면서 기능을 덧붙이는 패턴입니다. `FilterInputStream` 문서는 다른 입력 스트림을 감싸 기본 데이터 원천으로 쓰면서 데이터를 변환하거나 기능을 더하고, 나머지 요청은 감싼 스트림에 그대로 넘긴다고 설명합니다. 같은 인터페이스를 유지하므로 여러 겹으로 중첩할 수 있습니다. 스프링의 `TaskDecorator`는 문서가 직접 decorator라는 이름을 붙인 콜백으로, 실행될 `Runnable`을 감싸 실행 컨텍스트를 설정하거나 통계를 남기는 용도이고, Nystrom은 로깅을 덧씌우는 래퍼를 데코레이터 예로 듭니다.

```java
static class LoggedAudio implements Audio {
    private final Audio wrapped;
    LoggedAudio(Audio w) { wrapped = w; }
    public void play(int id) { System.out.println("  log: play " + id); wrapped.play(id); }
}
new LoggedAudio(new LoggedAudio(new RealAudio())).play(7);   // 두 겹 래핑
```

(공식 문서) `FilterInputStream` 문서는 다른 입력 스트림을 감싸 데이터를 변환하거나 부가 기능을 제공하며 선택한 메서드만 오버라이드하고 나머지는 감싼 스트림에 넘기는 클래스이고, `BufferedInputStream`, `DataInputStream` 등이 서브클래스라고 한다. `Collections` 문서는 `synchronizedList`가 지정한 리스트를 기반으로 하는 동기화(스레드 안전) 리스트를 돌려준다고 한다. `TaskDecorator` API 문서는 실행될 `Runnable`에 적용되는 데코레이터를 위한 콜백 인터페이스이며 주 용도가 실행 컨텍스트 설정이나 모니터링이라고 한다.
(원저자 자료) Nystrom, "Service Locator" 장: 서비스로 노출된 오디오 구현을 감싸는 `LoggedAudio`를 데코레이터 패턴으로 풀어, 로깅을 선택적으로 켤 수 있다고 소개한다.
(실험 확인) `FilterReader`를 상속해 대문자로 바꾸는 래퍼를 만들어 `BufferedReader`와 `StringReader` 사이에 끼우자 `hello`가 `HELLO`로 읽혔고, `BufferedReader`도 `Reader`의 하위 타입이었다. `Collections.synchronizedList(backing)`에 `add`한 값이 원본 리스트에도 보였다.
(보충) JDK 문서는 이 클래스들을 데코레이터 패턴이라고 부르지 않는다. 데코레이터의 정의는 GoF 원서를 읽지 못해 일반적으로 알려진 설명이며 대응은 해석이다.
