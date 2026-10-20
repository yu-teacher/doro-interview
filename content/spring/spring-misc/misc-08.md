---
slug: "misc-08"
topic: "spring-misc"
tier: DEEP
difficulty: 2
title: "RestClient, RestTemplate, WebClient, `@HttpExchange` 인터페이스 클라이언트는 어떻게 선택하나요?"
keywords: ["RestClient 권장", "RestTemplate deprecated(7.0)", "WebClient = 비동기·스트리밍", "HTTP Service Client", "RestClientAdapter"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
동기 방식 호출에는 이제 `RestClient`가 권장됩니다. `RestTemplate`과 같은 하위 HTTP 추상화를 공유하면서 `WebClient` 같은 fluent API를 제공합니다. `RestTemplate`은 Spring 7.0 문서에서 `RestClient`로 대체하라고 deprecated 되었고 향후 제거될 예정이며, 기존 코드는 `RestClient.create(restTemplate)`로 점진적으로 옮길 수 있습니다. 비동기, 스트리밍이 필요하면 `WebClient`입니다. 그리고 `@HttpExchange`로 Java 인터페이스에 HTTP 호출을 선언하면 프록시가 구현을 만들어 주는데, 내부 실행 엔진은 RestClient, WebClient, RestTemplate 중 어댑터로 고를 수 있습니다. 호출 코드가 선언적으로 깔끔해집니다.

```java
@HttpExchange(url = "/repos/{owner}/{repo}", accept = "application/vnd.github.v3+json")
interface RepositoryService {
    @GetExchange
    Repository getRepository(@PathVariable String owner, @PathVariable String repo);
}

RestClient restClient = RestClient.create("https://api.github.com");
var factory = HttpServiceProxyFactory.builderFor(RestClientAdapter.create(restClient)).build();
RepositoryService service = factory.createClient(RepositoryService.class);
```

(공식) 위 내용은 Spring Framework 7.0 REST clients 레퍼런스에서 확인했다. 또한 7.0 릴리스 노트는 `RestTemplate`이 7.0 레퍼런스 문서에서 deprecated 되고 7.1에서 `@Deprecated`로 표시될 예정이라고 적고 있다.
(공식) RestClient 기본 요청 팩토리는 다른 라이브러리가 없으면 JDK `HttpClient` 기반이고, `RestTemplate`은 `HttpURLConnection` 기반이다.
