---
slug: "mvc-18"
topic: "spring-mvc"
tier: DEEP
difficulty: 2
title: "Spring 7의 API 버전 관리(API Versioning) 지원을 설명해 주세요."
keywords: ["API Versioning", "ApiVersionStrategy", "configureApiVersioning", "version 속성", "baseline 버전", "Deprecation/Sunset 헤더"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/web/webmvc-versioning.html", "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-config/api-version.html", "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-requestmapping.html", "https://docs.spring.io/spring-boot/appendix/application-properties/index.html"]
---
**모범 답변 (30~60초)**
Spring Framework 7 MVC는 API 버전 관리를 프레임워크 기능으로 지원합니다. `WebMvcConfigurer`의 `configureApiVersioning`에서 요청 헤더, 요청 파라미터, 경로 세그먼트, 미디어 타입 파라미터 중 버전을 읽을 위치를 정하거나 커스텀 `ApiVersionResolver`를 씁니다. 그러면 `@GetMapping(version = "1.1")`처럼 매핑의 `version` 속성으로 버전별 메서드를 나눌 수 있고, `"1.2+"`는 1.2와 그 이상의 지원 버전에 매칭하는 baseline 표기입니다. 지원하지 않는 버전은 `InvalidApiVersionException`으로 400이고, 기본적으로 버전은 필수라 없으면 400입니다. `Deprecation`, `Sunset` 헤더로 폐기 예고도 보냅니다.

- (공식 문서, API Versioning) 중심 전략은 `ApiVersionStrategy`로, `ApiVersionResolver`로 요청에서 버전을 읽고 `ApiVersionParser`로 `Comparable`로 파싱하며 버전을 검증하고 폐기 힌트를 보낸다. 내장 파서는 버전을 major, minor, patch 정수로 파싱하는 시맨틱 파서이고 minor와 patch가 없으면 0이다. 지원 버전은 기본적으로 어노테이션 컨트롤러 매핑에 선언된 버전에서 초기화되며 플래그로 끄고 설정에 명시한 버전만 쓸 수 있다. 버전이 필수일 때 누락되면 `MissingApiVersionException`(400)이고, 선택으로 바꾸면 가장 최신 버전이 쓰이며 기본 버전도 지정할 수 있다. `StandardApiVersionDeprecationHandler`가 `Deprecation`, `Sunset`, `Link` 헤더(RFC 9745, RFC 8594)를 설정할 수 있다.
- (공식 문서, MVC Config) 경로 세그먼트로 해석하려면 세그먼트의 인덱스를 지정하고 그 세그먼트는 `/{version}` 같은 URI 변수로 선언해야 한다.
- (공식 문서, Request Mapping) `@RequestMapping`의 `version` 속성: 고정 버전(`"1.2"`)은 해당 버전만, baseline 버전(`"1.2+"`)은 해당 버전과 그보다 높은 지원 버전에, 값이 없으면 모든 버전에 매칭하되 더 구체적인 버전 매칭에 밀린다. 요청 버전 이하인 여러 메서드 중 가장 높고 요청 버전에 가까운 것이 선택된다. 매핑이 없으면 `NotAcceptableApiVersionException`으로 400이 된다.
- (공식 문서, Boot 프로퍼티) Boot에는 `spring.mvc.apiversion.use.header`, `.use.query-parameter`, `.use.path-segment`, `.use.media-type-parameter.*`, `.supported`, `.default`, `.required`, `.detect-supported` 같은 설정 프로퍼티가 있다.
- (실험 확인) `configureApiVersioning`에서 요청 헤더로 버전을 읽게 하고 지원 버전을 등록한 뒤, 같은 URL에 `version = "1"`, `version = "2"` 핸들러를 두면 헤더 값에 따라 해당 핸들러가 선택된다. 지원 목록에 없는 버전이나 버전 헤더 누락은 4xx로 거절된다.

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void configureApiVersioning(ApiVersionConfigurer configurer) {
        configurer.useRequestHeader("API-Version");
    }
}

@GetMapping(path = "/{id}", version = "1.1")
public Account getV1_1() { ... }

@GetMapping(path = "/{id}", version = "1.2+")
public Account getV1_2Plus() { ... }
```
