---
slug: "mvc-08"
topic: "spring-mvc"
tier: DEEP
difficulty: 2
title: "Filter, HandlerInterceptor, AOP는 각각 어디에 위치하고 언제 쓰나요?"
keywords: ["Filter", "HandlerInterceptor", "AOP", "Servlet 레벨 vs MVC 레벨 vs 빈 메서드 레벨", "실행 순서"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/web/webmvc/filters.html", "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet/handlermapping-interceptor.html", "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-config/interceptors.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/HandlerInterceptor.html", "https://docs.spring.io/spring-boot/reference/web/servlet.html"]
---
**모범 답변 (30~60초)**
셋은 끼어드는 층이 다릅니다. Servlet `Filter`는 필터 체인과 대상 Servlet의 앞뒤에서 동작해 DispatcherServlet 앞에서 요청 전체를 감쌉니다. 어떤 컨트롤러가 처리할지는 모르고, CORS, 프록시 헤더 처리, 보안(Spring Security) 같은 MVC 이전의 공통 처리에 씁니다. `HandlerInterceptor`는 HandlerMapping이 핸들러를 정한 뒤 실행 전후에 끼어들고, `preHandle`이 선택된 핸들러를 인자로 받으며 경로 패턴으로 범위를 정합니다. AOP는 Servlet·MVC와 무관하게 빈 메서드 호출을 프록시로 감싸 트랜잭션 같은 횡단 관심사에 씁니다. 순서는 Filter, DispatcherServlet, Interceptor, 컨트롤러, 서비스입니다.

- (공식 문서, Filters) Servlet `Filter`는 나머지 필터 체인과 대상 Servlet의 앞뒤에 인터셉션 방식 로직을 적용한다. `spring-web`은 Form Data, Forwarded Headers, Shallow ETag, CORS, URL Handler 필터를 제공하고, 기반 클래스로 `GenericFilterBean`, `OncePerRequestFilter`가 있다. Spring Security와 함께 쓸 때는 내장 `CorsFilter`를 Spring Security 필터 체인보다 앞에 두라고 권장한다. Boot에서는 `Filter`를 빈으로 선언하면 설정된다.
- (공식 문서, Interception·Interceptors) 인터셉터는 `WebMvcConfigurer.addInterceptors`로 등록하며 `addPathPatterns`, `excludePathPatterns`를 지원한다. `preHandle`은 HandlerMapping이 핸들러를 정한 뒤 HandlerAdapter가 호출하기 전에 불리며 선택된 핸들러를 인자로 받는다(Javadoc). 인터셉터는 어노테이션 컨트롤러 경로 매칭과 어긋날 수 있어 보안 계층으로 적합하지 않고, Servlet 필터 체인에 통합된 Spring Security를 가능한 한 일찍 적용하라고 안내한다.
- (공식 문서, Boot) 기본적으로 정적 콘텐츠 서빙이 `/**`에 매핑되어 모든 요청에 핸들러를 제공하며, 정적 콘텐츠가 없으면 `ResourceHttpRequestHandler`가 `NoResourceFoundException`을 던진다.
- (보충) AOP의 위치와 용도 설명은 읽은 MVC 문서 범위 밖의 일반 지식이다.
- (실험 확인) 호출 순서는 filter-before, preHandle, controller, postHandle, afterCompletion, filter-after였다. 매핑된 컨트롤러가 없는 URL(404)에서도 필터는 실행된다. 인터셉터는 "컨트롤러가 있는 요청"에만 도는 것이 아니라 경로 패턴에 걸리는 URL이면 컨트롤러가 없어도 실행되는데, Boot 기본 구성에서 `/**`로 매핑된 정적 리소스 핸들러(`ResourceHttpRequestHandler`)가 핸들러로 선택되기 때문이다. 인터셉터 경로 패턴 밖의 URL에서는 필터만 실행된다.

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new LoggingInterceptor())
                .addPathPatterns("/api/**");
    }
}
```
