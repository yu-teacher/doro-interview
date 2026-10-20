---
slug: "mvc-18"
topic: "spring-mvc"
tier: DEEP
difficulty: 2
title: "Spring 7의 API 버전 관리(API Versioning) 지원을 설명해 주세요."
keywords: ["API Versioning", "ApiVersionStrategy", "configureApiVersioning", "version 속성", "baseline 버전", "Deprecation/Sunset 헤더"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
"Spring Framework 7 MVC에는 API 버전 관리가 프레임워크 기능으로 들어왔습니다. `WebMvcConfigurer`의 `configureApiVersioning`에서 버전을 어디서 읽을지, 예를 들어 요청 헤더, 쿼리 파라미터, 경로 세그먼트, 미디어 타입 파라미터 중 하나를 정하면 됩니다. 그러면 `@GetMapping(version = "1.1")` 처럼 매핑 어노테이션의 `version` 속성으로 버전별 메서드를 나눌 수 있습니다. `"1.2+"`는 그 버전 이상을 뜻하는 baseline 표기입니다. 지원하지 않는 버전은 `InvalidApiVersionException`으로 400이 되고, 기본적으로 버전은 필수입니다. `Deprecation`, `Sunset` 헤더로 폐기 예고를 보낼 수도 있습니다."

- (공식 문서) 위 내용은 Spring Framework 7.0.x의 API versioning 개요, MVC Config, Request Mapping 페이지에서 확인했습니다. 파서 기본값은 시맨틱 버전 파서, 매핑에 선언한 버전은 기본적으로 자동 수집됩니다. 문서상 Boot 전용 설정 프로퍼티는 확인되지 않았습니다.

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
