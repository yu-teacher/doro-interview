---
slug: "mvc-23"
topic: "spring-mvc"
tier: TRICKY
difficulty: 3
title: "요청 처리 중 오래 걸리는 작업이 있으면 스레드를 어떻게 풀어줄 수 있나요?"
keywords: ["Callable", "DeferredResult", "CompletableFuture", "SseEmitter", "요청 스레드 반환"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
"컨트롤러가 `Callable`, `DeferredResult`, `CompletableFuture` 같은 비동기 타입을 반환하면 Servlet 요청 스레드는 컨테이너로 반환되고, 결과가 준비되면 다시 디스패치되어 응답이 완성됩니다. `Callable`은 Spring MVC가 관리하는 스레드에서 실행되고, `DeferredResult`는 이벤트나 콜백으로 다른 스레드에서 값을 채울 수 있습니다. 스트리밍은 `SseEmitter`, `StreamingResponseBody`를 씁니다. 다만 비동기 반환 자체가 마법은 아니어서 내부에서 블로킹 호출을 하면 어딘가의 스레드는 여전히 묶이므로, 별도 실행기 설계가 중요합니다. 가상 스레드는 이 부담을 줄이는 또 다른 선택지입니다."

- (공식 문서) 반환 타입 표에서 `DeferredResult`, `Callable`, `CompletableFuture`/`CompletionStage`, `ResponseBodyEmitter`/`SseEmitter`, `StreamingResponseBody`, `Mono`/`Flux` 설명을 확인했습니다.
- (보충) "요청 스레드가 컨테이너로 반환되고 이후 재디스패치된다"는 비동기 처리 메커니즘은 Servlet 비동기 일반 지식입니다.
