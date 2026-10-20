---
slug: "mvc-05"
topic: "spring-mvc"
tier: BASIC
difficulty: 1
title: "`HttpMessageConverter`는 무엇이고 어떻게 동작하나요?"
keywords: ["HttpMessageConverter", "Content-Type", "Accept", "Jackson", "415/406"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/requestbody.html", "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/responsebody.html", "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-config/message-converters.html", "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet/exceptionhandlers.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/http/converter/HttpMessageConverter.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/mvc/support/DefaultHandlerExceptionResolver.html"]
---
**모범 답변 (30~60초)**
`HttpMessageConverter`는 HTTP 본문과 자바 객체 사이를 변환하는 전략 인터페이스입니다. `@RequestBody` 인자는 요청 본문을 객체로 읽을 때, `@ResponseBody`나 `ResponseEntity` 반환값은 객체를 응답 본문에 쓸 때 컨버터를 거칩니다. 컨버터는 `canRead`, `canWrite`로 자바 타입과 미디어 타입 지원 여부를 알려 주므로, 요청 `Content-Type`과 응답 `Accept`·반환 타입에 맞는 컨버터가 쓰입니다. JSON은 Spring 7에서 Jackson 기반 `JacksonJsonHttpMessageConverter`가 맡습니다. 지원하지 않는 본문 타입은 415, 만들 수 없는 응답 형식은 406으로 매핑됩니다. `configureMessageConverters`로 컨버터를 설정할 수 있습니다.

- (공식 문서) `@RequestBody`는 본문을 `HttpMessageConverter`로 읽어 객체로 역직렬화하고, `@ResponseBody`는 반환값을 `HttpMessageConverter`로 응답 본문에 직렬화한다. `HttpMessageConverter` Javadoc은 HTTP 요청·응답과의 변환을 위한 전략 인터페이스라고 하며, `canRead(Class, MediaType)`, `canWrite(Class, MediaType)`, `getSupportedMediaTypes()`를 제공한다.
- (공식 문서, 버전 의존) Spring Framework 7의 MVC Config 문서는 `configureMessageConverters(HttpMessageConverters.ServerBuilder)`를 오버라이드해 컨버터를 설정하는 방법을 보여 주며, 예시에서 `JacksonJsonHttpMessageConverter`(JSON)와 `JacksonXmlHttpMessageConverter`(XML)를 쓴다.
- (공식 문서) `DefaultHandlerExceptionResolver` Javadoc의 매핑표: `HttpMediaTypeNotSupportedException`은 415, `HttpMediaTypeNotAcceptableException`은 406이다.
- (보충) 요청 `Content-Type`과 `Accept`를 어떤 순서로 비교해 컨버터를 고르는지의 세부 알고리즘은 읽은 문서에 서술이 없다. 위 답변의 선택 기준은 `canRead`/`canWrite`가 `MediaType` 인자를 받는다는 시그니처에서 이해한 것이다.
- (실험 확인) JSON 요청을 받는 핸들러에 `Content-Type: text/plain`으로 POST하면 415, `produces`가 JSON뿐인 핸들러에 `Accept: application/xml`로 요청하면 406이 된다. `@RestController` 핸들러에 `Accept: application/json`으로 요청하면 `application/json`으로 직렬화된다.
