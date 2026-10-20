---
slug: "misc-16"
topic: "spring-misc"
tier: TRICKY
difficulty: 3
title: "RestTemplate을 쓰는 기존 코드는 어떻게 이전하나요?"
keywords: ["`RestClient.create(restTemplate)`", "마이그레이션 가이드", "공유 `ClientHttpRequestFactory`", "기본 구현 차이"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/integration/rest-clients.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/client/RestClient.html"]
concepts: [http-client, spring-migration]
importance: 1
---
**모범 답변 (30~60초)**
한 번에 바꿀 필요 없이 점진적으로 이전할 수 있습니다. 공식 문서의 "Migrating to RestClient" 절은 먼저 `RestClient.create(restTemplate)`로 기존 RestTemplate의 설정을 이어받은 RestClient를 만들고, 요청 코드를 컴포넌트 단위로 하나씩 바꾼 뒤, 마지막에 인프라 설정을 `RestClient.Builder`로 옮기라고 합니다. 대응표도 있습니다. 둘은 같은 인프라를 공유해서 `ClientHttpRequestFactory`나 인터셉터를 재사용할 수 있고, 예외도 `RestClientException` 계층으로 같습니다. 다만 기본 HTTP 라이브러리가 달라(RestClient는 다른 라이브러리가 없으면 JDK HttpClient, RestTemplate은 HttpURLConnection) 런타임 동작에 미묘한 차이가 날 수 있습니다.

(공식 문서) Framework 7.0 REST clients 레퍼런스의 "Migrating to RestClient" 절이 단계를 이렇게 제시한다. 기존 `RestTemplate` 인스턴스로 `RestClient.create(restTemplate)`을 만들고, 요청을 보내는 코드부터 컴포넌트 단위로 점진 교체하며(대응표 참고), 모든 요청이 RestClient를 통하면 `RestClient.Builder`로 기존 RestTemplate 생성 설정을 재현한다. 둘이 인프라를 공유하므로 커스텀 `ClientHttpRequestFactory`나 `ClientHttpRequestInterceptor`를 재사용할 수 있다고 한다. 클래스패스에 다른 라이브러리가 없으면 RestClient는 JDK `HttpClient` 기반의 `JdkClientHttpRequestFactory`를, RestTemplate은 `HttpURLConnection` 기반의 `SimpleClientHttpRequestFactory`를 고르며 이것이 런타임의 미묘한 HTTP 수준 동작 차이를 설명할 수 있다고 한다. 예외 절은 RestClient와 RestTemplate이 예외를 던지는 방식이 같고(`RestClientException`이 계층 최상위), RestTemplate은 4xx에 일관되게 `HttpClientErrorException`을 던지는 반면 RestClient는 커스텀 상태 핸들러로 더 유연하게 다룰 수 있다고 설명한다. `RestClient` Javadoc은 `create(RestTemplate)`이 주어진 템플릿의 요청 팩토리, 메시지 컨버터, 인터셉터, 이니셜라이저, `UriBuilderFactory`, 에러 핸들러를 이어받는 클라이언트를 만든다고 한다.
