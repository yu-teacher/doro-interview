---
slug: "scl-12"
topic: "spring-cloud"
tier: DEEP
difficulty: 2
title: "OpenFeign과 스프링의 HTTP 인터페이스(`@HttpExchange`)는 무엇이 다르고, 지금은 무엇을 선택하나요?"
keywords: ["@FeignClient 선언적 클라이언트", "OpenFeign은 feature-complete", "HTTP 서비스 클라이언트로 이전 권고", "HttpServiceProxyFactory", "로드 밸런싱·서킷 브레이커 연동"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-cloud-openfeign/reference/spring-cloud-openfeign.html", "https://docs.spring.io/spring-framework/reference/integration/rest-clients.html", "https://docs.spring.io/spring-cloud-commons/reference/spring-cloud-circuitbreaker.html"]
concepts: [http-client]
importance: 2
links: [{to: "wfx-14", kind: RELATED}]
---
**모범 답변 (30~60초)**
둘 다 인터페이스에 선언만 하면 프록시가 HTTP 호출을 만들어 주는 선언적 클라이언트입니다. `@FeignClient`는 Feign 라이브러리 기반이고 스프링 클라우드가 스프링 MVC 어노테이션 지원과 로드 밸런서, 서킷 브레이커 연동을 붙입니다. `@HttpExchange`는 스프링 프레임워크 자체 기능이라 `HttpServiceProxyFactory`가 `RestClient`나 `WebClient` 위에 프록시를 만들고, 스프링 클라우드는 HTTP 서비스 그룹 설정으로 로드 밸런싱과 서킷 브레이커를 더합니다. OpenFeign 문서가 프로젝트를 feature-complete로 보고 HTTP 서비스 클라이언트로 옮기라고 권고하므로, 새로 짜는 코드는 그쪽을 기본으로 삼을 만합니다.

```java
@HttpExchange("/stores")
interface StoreClient {
    @GetExchange("/{id}") String get(@PathVariable String id);
}

StoreClient c = HttpServiceProxyFactory
    .builderFor(RestClientAdapter.create(RestClient.create(baseUrl)))
    .build().createClient(StoreClient.class);
```

(공식 문서) OpenFeign 문서는 Feign이 선언적 웹 서비스 클라이언트이고 스프링 클라우드가 스프링 MVC 어노테이션과 `HttpMessageConverters` 지원을 더하며 Eureka, 서킷 브레이커, 로드 밸런서를 통합한다고 쓴다. `@FeignClient`의 값은 로드 밸런서 클라이언트를 만드는 이름이다. 리액티브 지원 절은 OpenFeign 프로젝트가 이제 feature-complete로 간주되어 업스트림이 지원하더라도 추가할 계획이 없고, 블로킹과 리액티브를 모두 지원하는 스프링 HTTP 서비스 클라이언트로 이전하라고 권한다고 쓴다. 기본 `Retryer`는 `NEVER_RETRY`다.
(공식 문서) 스프링 프레임워크 REST 클라이언트 문서는 `@HttpExchange` 메서드가 있는 자바 인터페이스를 정의하고 `HttpServiceProxyFactory`로 `RestClient`, `WebClient`, `RestTemplate` 위의 프록시를 만든다고 설명한다. HTTP 서비스 그룹을 `HttpServiceGroupConfigurer`로 설정할 수 있고, 부트는 그룹별 클라이언트 프로퍼티를, 시큐리티는 OAuth를, 스프링 클라우드는 로드 밸런싱을 더한다고 밝힌다. Commons 서킷 브레이커 문서에는 HTTP 서비스 그룹용 `CircuitBreakerRestClientHttpServiceGroupConfigurer` 등이 있고 `@HttpServiceFallback`으로 폴백 클래스를 선언한다.
(실험 확인) 스프링 프레임워크 7.0.10 jar만 클래스패스에 놓고(부트, 클라우드 없음) JDK 25의 `HttpServer`를 localhost에 띄워 `@HttpExchange` 인터페이스에 `RestClientAdapter`와 `HttpServiceProxyFactory`로 프록시를 만들었다. `@GetExchange("/{id}")` 메서드는 200 본문을 문자열로 돌려줬고, 항상 503을 내는 엔드포인트를 한 번 호출하자 `HttpServerErrorException.ServiceUnavailable`이 던져졌으며 서버가 받은 요청은 1회였다. 즉 이 설정에서는 프록시가 재시도하지 않았다(서킷 브레이커는 붙이지 않았다). `@PathVariable`에 이름을 쓰지 않으면 `-parameters` 없이 컴파일했을 때 인자 이름 오류가 났다. 로드 밸런싱이 붙는 클라우드 연동은 실행하지 않았다.
