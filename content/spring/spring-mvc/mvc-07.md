---
slug: "mvc-07"
topic: "spring-mvc"
tier: DEEP
difficulty: 2
title: "Servlet 컨테이너의 thread-per-request 모델과, Spring이 스레드에 대해 하는 일/하지 않는 일을 설명해 주세요."
keywords: ["thread-per-request", "Tomcat 스레드 풀", "블로킹", "싱글톤 빈 스레드 안전성", "비동기 반환 타입"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/return-types.html", "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-async.html", "https://docs.spring.io/spring-framework/reference/web/webflux/new-framework.html", "https://docs.spring.io/spring-framework/reference/core/beans/factory-scopes.html", "https://docs.spring.io/spring-boot/appendix/application-properties/index.html"]
concepts: [thread-pool, thread-process]
importance: 2
links: [{to: "mvc-16", kind: FOLLOWUP}, {to: "mvc-17", kind: FOLLOWUP}, {to: "mvc-23", kind: FOLLOWUP}, {to: "misc-01", kind: RELATED}, {to: "misc-07", kind: RELATED}]
---
**모범 답변 (30~60초)**
전통적인 Spring MVC는 Tomcat 같은 Servlet 컨테이너 위에서 동작합니다. 문서는 애플리케이션이 현재 스레드를 블로킹할 수 있다고 가정해 컨테이너가 큰 스레드 풀로 흡수한다고 설명하며, 요청 하나를 스레드 하나가 필터부터 DB 호출까지 동기 블로킹으로 처리하는 것이 흔히 thread-per-request라 부르는 모델입니다. Tomcat 스레드 풀은 컨테이너 설정이고 Boot에서 `server.tomcat.threads.max` 기본값은 200입니다. Spring은 `Callable`, `DeferredResult`, `CompletableFuture` 같은 비동기 반환 타입으로 요청 스레드를 일찍 풀어 줄 뿐입니다. 빈은 기본이 싱글톤이라 여러 요청 스레드가 공유하므로 상태 필드는 스레드 안전하지 않습니다.

- (공식 문서, WebFlux 개요) Spring MVC(와 Servlet 애플리케이션 일반)는 애플리케이션이 현재 스레드를 블로킹할 수 있다고 가정하며, 이 때문에 Servlet 컨테이너는 큰 스레드 풀을 쓴다. Servlet API의 계약은 `Filter`, `Servlet`처럼 동기적이거나 `getParameter`, `getPart`처럼 블로킹이다.
- (공식 문서, Boot 프로퍼티) `server.tomcat.threads.max`는 워커 스레드 최대 수이며 기본값은 200이고, 가상 스레드를 켜면 효과가 없다고 설명한다.
- (공식 문서, 반환값·비동기 요청) `Callable`은 Spring MVC가 관리하는 스레드에서, `DeferredResult`는 임의의 스레드에서 값을 만든다. `CompletableFuture`/`CompletionStage`는 `DeferredResult`의 대안으로 지원된다. `Callable`은 설정된 `AsyncTaskExecutor`로 실행된다.
- (공식 문서, 빈 스코프) 싱글톤은 컨테이너당 하나의 공유 인스턴스이고 기본 스코프이다. 상태를 가진(stateful) 빈에는 prototype 스코프를, 상태가 없는 빈에는 singleton 스코프를 쓰라고 한다. `HttpSession` 접근은 스레드 안전하지 않다고 인자 표가 경고한다.
- (보충) "thread-per-request"라는 이름과 "요청 하나에 스레드 하나" 표현은 Servlet 컨테이너 일반 용어이며 읽은 문서에는 이 문구가 없다.
- (실험 확인) 임베디드 Tomcat 위에서 요청은 테스트 스레드가 아니라 `http-nio-*-exec-N` 워커 스레드에서 처리되고, 한 요청의 필터, 인터셉터, 컨트롤러는 모두 같은 스레드에서 실행된다. 서버 안에서 서로를 기다려야 통과하는 두 요청을 동시에 보내면 둘 다 통과하는데, 서로 다른 스레드에서 동시에 실행됨을 뜻한다.

```java
@Service
public class CounterService {
    private int count;                 // 싱글톤 + 가변 필드 = 경쟁 조건 위험
    public void inc() { count++; }
}
```
