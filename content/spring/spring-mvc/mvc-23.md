---
slug: "mvc-23"
topic: "spring-mvc"
tier: TRICKY
difficulty: 3
title: "요청 처리 중 오래 걸리는 작업이 있으면 스레드를 어떻게 풀어줄 수 있나요?"
keywords: ["Callable", "DeferredResult", "CompletableFuture", "SseEmitter", "요청 스레드 반환"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-async.html", "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/return-types.html", "https://docs.spring.io/spring-boot/reference/features/task-execution-and-scheduling.html"]
concepts: [thread-pool, mvc-request-flow]
importance: 2
links: [{to: "mvc-07", kind: PREREQ}, {to: "jt-14", kind: RELATED}, {to: "mvc-17", kind: RELATED}]
---
**모범 답변 (30~60초)**
컨트롤러가 `Callable`, `DeferredResult`, `CompletableFuture` 같은 비동기 타입을 반환하면 Spring MVC가 `request.startAsync()`를 호출하고, DispatcherServlet과 필터는 컨테이너 스레드를 반납하지만 응답은 열려 있습니다. 결과가 준비되면 요청이 다시 디스패치되어 응답이 완성됩니다. `Callable`은 `AsyncTaskExecutor`가 Spring MVC 관리 스레드에서 실행하고, `DeferredResult`는 이벤트나 콜백으로 다른 스레드가 값을 채웁니다. 스트리밍은 `SseEmitter`, `StreamingResponseBody`를 씁니다. 다만 `Callable` 안에서 블로킹하면 그 실행기 스레드가 묶이므로 실행기 설계가 중요하고, 가상 스레드는 이 부담을 줄이는 선택지입니다.

- (공식 문서, 비동기 요청) `DeferredResult`는 컨트롤러가 반환해 어딘가 저장해 두면 다른 스레드가 `setResult`로 값을 채우고, Spring MVC가 요청을 컨테이너로 되돌려 디스패치해 비동기로 만들어진 반환값으로 처리를 재개한다. `Callable`은 `request.startAsync()` 호출 후 `AsyncTaskExecutor`에 제출되어 별도 스레드에서 처리되고 그동안 DispatcherServlet과 필터가 컨테이너 스레드에서 빠져나가며 응답은 열려 있다. WebFlux와 비교하면 MVC의 스트리밍도 응답 쓰기는 블로킹이고 별도 스레드에서 수행되며, 비동기 요청 처리는 Servlet 컨테이너 수준에서 활성화해야 한다.
- (공식 문서, 반환값 표) `DeferredResult`는 임의의 스레드에서, `Callable`은 Spring MVC가 관리하는 스레드에서 비동기로 값을 만든다. `CompletionStage`/`CompletableFuture`는 `DeferredResult`의 대안이고, `ResponseBodyEmitter`/`SseEmitter`는 객체 스트림을, `StreamingResponseBody`는 응답 `OutputStream`에 비동기로 쓴다. `Mono`는 `DeferredResult`와 비슷하게 취급된다.
- (공식 문서, Boot) Spring MVC의 비동기 요청 처리에는 Boot가 자동 구성한 `AsyncTaskExecutor`가 쓰이고, 가상 스레드를 켜면 이 실행기는 가상 스레드를 쓰는 `SimpleAsyncTaskExecutor`가 된다.
- (보충) "`Callable` 안에서 블로킹 호출을 하면 그 스레드가 묶인다"는 표현은 위 사실에서 이끌어 낸 일반 설명이다.
