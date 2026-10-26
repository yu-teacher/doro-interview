---
slug: "wfx-05"
topic: "spring-webflux"
tier: BASIC
difficulty: 1
title: "Spring WebFlux가 제공하는 두 가지 프로그래밍 모델은 무엇이 다른가요?"
keywords: ["어노테이션 컨트롤러", "함수형 엔드포인트", "RouterFunction·HandlerFunction", "리액티브 @RequestBody", "같은 리액티브 코어"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-framework/reference/web/webflux/new-framework.html", "https://docs.spring.io/spring-framework/reference/web/webflux-functional.html", "https://docs.spring.io/spring-framework/reference/web/webflux/controller/ann-methods/requestbody.html", "https://docs.spring.io/spring-framework/reference/web/webflux/controller.html"]
concepts: [mvc-request-flow, reactive-programming]
importance: 2
links: [{to: "mvc-03", kind: RELATED}]
---
**모범 답변 (30~60초)**
어노테이션 컨트롤러와 함수형 엔드포인트입니다. 어노테이션 컨트롤러는 Spring MVC와 같은 `@RestController`, `@GetMapping`을 쓰고 메서드가 `Mono`나 `Flux`를 반환할 수 있습니다. 눈에 띄는 차이는 WebFlux에서는 `@RequestBody` 인자도 `Mono<Account>` 같은 리액티브 타입으로 받을 수 있다는 점입니다. 함수형 엔드포인트는 `RouterFunction`이 요청을 `HandlerFunction`에 연결하고, 핸들러가 `ServerRequest`를 받아 `Mono<ServerResponse>`를 돌려주는 람다 기반 모델입니다. 앞쪽은 어노테이션으로 의도를 선언하고 호출을 받으며, 뒤쪽은 애플리케이션이 요청 처리를 처음부터 끝까지 직접 맡는다는 점이 큰 차이입니다. 둘 다 같은 리액티브 코어 위에서 동작합니다.

(공식 문서, WebFlux 개요) `spring-web` 모듈의 리액티브 기반 위에 두 모델이 있다. 어노테이션 컨트롤러는 Spring MVC와 같은 어노테이션 기반이고 둘 다 Reactor, RxJava 반환 타입을 지원해 구분하기 쉽지 않으며, 눈에 띄는 차이로 WebFlux는 리액티브 `@RequestBody` 인자를 지원한다. 함수형 엔드포인트는 람다 기반의 가벼운 모델로, 애플리케이션이 요청 처리를 처음부터 끝까지 맡는다는 점이 어노테이션 방식과 다르다고 설명한다.
(공식 문서, 함수형 엔드포인트) `HandlerFunction`은 `ServerRequest`를 받아 지연된 `ServerResponse`(`Mono<ServerResponse>`)를 반환하며 `@RequestMapping` 메서드 본문에 해당한다. `RouterFunction`은 `ServerRequest`를 받아 지연된 `HandlerFunction`을 반환하고, 일치하지 않으면 빈 `Mono`이다. `@RequestMapping` 어노테이션에 해당하지만 데이터뿐 아니라 동작도 제공한다는 점이 다르다. 어노테이션 방식의 대안이며 같은 Reactive Core 위에서 돈다.
(공식 문서, `@RequestBody`) Spring MVC와 달리 WebFlux의 `@RequestBody`는 리액티브 타입을 지원하며 완전한 논블로킹 읽기와 클라이언트에서 서버로의 스트리밍을 가능하게 한다.
Reactor와 WebFlux는 설치할 수 없어 실행해 확인하지 않았다.
