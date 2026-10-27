---
slug: "wfx-14"
topic: "spring-webflux"
tier: DEEP
difficulty: 2
title: "WebClient의 `retrieve()`와 `exchangeToMono()`는 어떻게 다르고, 4xx와 5xx 응답은 어떻게 처리되나요?"
keywords: ["retrieve로 본문 추출", "기본 4xx·5xx는 WebClientResponseException", "onStatus", "exchangeToMono로 상태별 디코딩", "본문 소비 책임"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-framework/reference/web/webflux-webclient/client-retrieve.html", "https://docs.spring.io/spring-framework/reference/web/webflux-webclient/client-exchange.html", "https://docs.spring.io/spring-framework/reference/web/webflux-webclient/client-builder.html", "https://docs.spring.io/spring-framework/reference/web/webflux-webclient.html"]
concepts: [http-client, reactive-programming]
importance: 1
links: [{to: "wfx-13", kind: PREREQ}, {to: "scl-12", kind: RELATED}, {to: "scl-20", kind: RELATED}]
---
**모범 답변 (30~60초)**
`retrieve()`는 응답에서 무엇을 꺼낼지 선언하는 간단한 방법으로, `bodyToMono`, `bodyToFlux`, `toEntity`로 이어집니다. 기본적으로 4xx나 5xx 응답은 상태 코드별 하위 클래스를 포함한 `WebClientResponseException`이 오류 신호로 전달되고, `onStatus` 핸들러로 상태별 처리를 바꿀 수 있습니다. 응답 상태에 따라 디코딩 방식을 달리하는 것처럼 세밀한 제어가 필요하면 `exchangeToMono`나 `exchangeToFlux`를 쓰는데, 이때는 반환한 Mono나 Flux가 끝난 뒤 본문이 소비되지 않았으면 자동으로 해제되므로, 필요한 디코딩은 함수 안에서 직접 선언해야 합니다. `WebClient`는 한번 만들면 불변이고 `mutate()`로 복제해 바꿉니다.

(공식 문서, WebClient retrieve()) `retrieve()`는 응답 추출 방식을 선언하며 `toEntity`, `bodyToMono`, `bodyToFlux`(스트림)를 예로 든다. 기본적으로 4xx나 5xx는 특정 상태 코드용 하위 클래스를 포함한 `WebClientResponseException`을 낳고, `onStatus` 핸들러로 오류 응답 처리를 바꿀 수 있다.
(공식 문서, WebClient Exchange) `exchangeToMono()`, `exchangeToFlux()`는 응답 상태에 따라 다르게 디코딩하는 것처럼 더 세밀한 제어가 필요한 고급 경우에 쓴다. 반환한 Mono나 Flux가 완료된 뒤 응답 본문이 소비되지 않았다면 메모리와 연결 누수를 막기 위해 해제되므로 이후 하류에서 더 디코딩할 수 없고, 필요한 디코딩은 제공한 함수가 선언해야 한다.
(공식 문서, WebClient 구성) 한 번 만들면 `WebClient`는 불변이며, `mutate()`로 복제해 빌더를 얻을 수 있다. 기본 코덱의 메모리 버퍼링 제한은 256KB이다.
Reactor와 WebFlux는 설치할 수 없어 실행해 확인하지 않았다.
