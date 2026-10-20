---
slug: "mvc-06"
topic: "spring-mvc"
tier: BASIC
difficulty: 1
title: "Content Negotiation은 어떻게 동작하나요?"
keywords: ["Accept 헤더", "produces", "consumes", "ContentNegotiationConfigurer"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-config/content-negotiation.html", "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-requestmapping.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/config/annotation/ContentNegotiationConfigurer.html"]
---
**모범 답변 (30~60초)**
Content Negotiation은 요청이 원하는 응답 미디어 타입을 정하는 과정입니다. Spring MVC는 기본적으로 `Accept` 헤더만 확인하고, `ContentNegotiationConfigurer`로 방식을 바꿀 수 있습니다. 쿼리 파라미터 방식은 `favorParameter`를 켜고 `mediaType`으로 키와 미디어 타입을 매핑해야 하며 기본 파라미터 이름은 `format`입니다. URL 기반 해석이 꼭 필요하면 경로 확장자보다 쿼리 파라미터 방식을 쓰라고 문서가 권합니다. 매핑에서는 `consumes`가 요청 `Content-Type`, `produces`가 `Accept`로 매핑을 좁히므로, 같은 URL이라도 `Accept`에 따라 다른 메서드로 갈 수 있습니다.

- (공식 문서, Content Types) 요청 미디어 타입은 Accept 헤더, URL 경로 확장자, 쿼리 파라미터 등으로 결정하도록 설정할 수 있고, 기본은 Accept 헤더만 확인한다. URL 기반이 꼭 필요하면 경로 확장자보다 쿼리 파라미터 전략을 고려하라고 한다. `configureContentNegotiation`의 `mediaType(key, MediaType)`으로 키와 미디어 타입을 매핑한다.
- (공식 문서, Javadoc) `favorParameter(boolean)`은 요청 파라미터(기본 이름 `format`)로 미디어 타입을 결정할지 정하며, 동작하려면 미디어 타입 매핑을 등록해야 하고 기본값은 false다. `parameterName`으로 이름을 바꾼다.
- (공식 문서, Request Mapping) `consumes`는 요청 `Content-Type`, `produces`는 `Accept` 요청 헤더로 매핑을 좁히며 `!text/plain` 같은 부정 표현을 지원한다. 클래스 수준에 선언한 `consumes`/`produces`는 확장되지 않고 메서드 수준 선언이 덮어쓴다. `headers`로 `Content-Type`/`Accept`를 매칭할 수 있지만 `consumes`/`produces`가 낫다고 한다.
- (실험 확인) `produces`가 JSON뿐인 핸들러는 `Accept: application/json`이면 200, `Accept: application/xml`이면 406이 된다.
