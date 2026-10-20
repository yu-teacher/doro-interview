---
slug: "mvc-07"
topic: "spring-mvc"
tier: DEEP
difficulty: 2
title: "Servlet 컨테이너의 thread-per-request 모델과, Spring이 스레드에 대해 하는 일/하지 않는 일을 설명해 주세요."
keywords: ["thread-per-request", "Tomcat 스레드 풀", "블로킹", "싱글톤 빈 스레드 안전성", "비동기 반환 타입"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
"전통적인 Spring MVC는 Tomcat 같은 Servlet 컨테이너 위에서 동작하고, 컨테이너가 관리하는 스레드 풀에서 요청 하나에 스레드 하나를 배정해 필터, DispatcherServlet, 컨트롤러, 서비스, DB 호출까지 그 스레드에서 동기·블로킹으로 처리합니다. 스레드 풀 크기, 큐, 타임아웃은 컨테이너 설정이고 Spring이 직접 풀을 만들지 않습니다. Spring이 해 주는 것은 `Callable`, `DeferredResult`, `CompletableFuture` 같은 비동기 반환 타입을 지원해서 요청 스레드를 일찍 풀어 주는 정도입니다. 반대로 Spring은 컨트롤러·서비스 코드의 스레드 안전성을 대신 보장해 주지 않습니다. 빈은 기본이 싱글톤이라 여러 스레드가 공유하므로, 가변 필드를 두면 안 되고 상태는 요청 범위나 지역 변수로 다뤄야 합니다."

- (공식 문서) 비동기 반환 타입: `Callable`은 Spring MVC가 관리하는 스레드에서, `DeferredResult`는 임의 스레드에서 값을 만들어 냅니다. `CompletableFuture`/`CompletionStage`도 지원합니다. WebFlux 문서는 Servlet API가 대체로 동기·블로킹이라고 설명합니다.
- (보충) Tomcat의 `server.tomcat.threads.max` 기본값은 200으로 알려져 있으나 이번 조사에서 공식 문서로 확인하지 못했습니다. 스레드 모델 자체(요청당 스레드 배정)도 Servlet 컨테이너 일반 지식입니다.

```java
@Service
public class CounterService {
    private int count;                 // 싱글톤 + 가변 필드 = 경쟁 조건 위험 (보충)
    public void inc() { count++; }
}
```
