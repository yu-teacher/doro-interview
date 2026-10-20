---
slug: "misc-08"
topic: "spring-misc"
tier: DEEP
difficulty: 2
title: "RestClient, RestTemplate, WebClient, `@HttpExchange` 인터페이스 클라이언트는 어떻게 선택하나요?"
keywords: ["RestClient 권장", "RestTemplate deprecated(7.0)", "WebClient = 비동기·스트리밍", "HTTP Service Client", "RestClientAdapter"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/integration/rest-clients.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/client/RestClient.html", "https://github.com/spring-projects/spring-framework/wiki/Spring-Framework-7.0-Release-Notes", "https://github.com/spring-projects/spring-framework/wiki/Spring-Framework-6.1-Release-Notes"]
concepts: [http-protocol]
importance: 2
links: [{to: "misc-16", kind: FOLLOWUP}, {to: "mvc-16", kind: RELATED}]
---
**모범 답변 (30~60초)**
동기 호출에는 이제 `RestClient`가 권장됩니다. 6.1에서 나온 `RestClient`는 `WebClient`와 비슷한 fluent API를 제공하면서 `RestTemplate`과 인프라를 공유합니다. `RestTemplate`은 7.0 레퍼런스 문서에서 deprecated 되어 향후 제거될 예정이고, `@Deprecated` 표시는 7.1에서 합니다. 기존 코드는 `RestClient.create(restTemplate)`로 점진적으로 옮길 수 있습니다. 비동기, 스트리밍이 필요하면 리액티브 `WebClient`입니다. `@HttpExchange`로 인터페이스에 HTTP 호출을 선언하면 `HttpServiceProxyFactory`가 프록시 구현을 만들어 주고, 실행 엔진은 어댑터로 RestClient, WebClient, RestTemplate 중에서 고릅니다.

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

(공식 문서) Spring Framework 7.0 REST clients 레퍼런스는 선택지를 네 가지로 든다. `RestClient`는 fluent API의 동기 클라이언트, `WebClient`는 fluent API의 논블로킹 리액티브 클라이언트(동기·비동기·스트리밍 상호작용 지원), `RestTemplate`은 템플릿 메서드 API의 동기 클라이언트로 "RestClient 대신 쓰도록 deprecated" 되었다고 한다. `RestTemplate` 절은 7.0부터 RestClient로 대체되어 향후 버전에서 제거될 예정이고 비동기·스트리밍은 `WebClient`를 고려하라고 한다. 7.0 릴리스 노트는 `RestTemplate`을 7.0 레퍼런스 문서에서 deprecated 처리했고 7.1에서 공식적으로 `@Deprecated`로 표시할 것이라고 한다. 6.1 릴리스 노트는 `RestClient`를 "`WebClient`와 비슷한 API를 제공하면서 `RestTemplate`과 인프라를 공유하는 동기 HTTP 클라이언트"로 소개한다. HTTP Service Client 절은 `@HttpExchange` 메서드를 가진 자바 인터페이스를 정의하고 `HttpServiceProxyFactory`로 클라이언트 프록시를 만들며, 호출은 RestClient, WebClient, RestTemplate 어댑터를 거쳐 나간다고 설명한다. 위 코드는 이 절의 예시를 합친 것이다. 요청 팩토리는 RestClient 빌드 시 지정하지 않으면 클래스패스에 Apache나 Jetty HttpClient가 있으면 그것을, 없고 `java.net.http` 모듈이 로드돼 있으면 JDK `HttpClient`를, 그것도 아니면 단순 기본값을 쓴다. 한편 `RestTemplate`의 기본값은 `HttpURLConnection` 기반의 `SimpleClientHttpRequestFactory`다.
