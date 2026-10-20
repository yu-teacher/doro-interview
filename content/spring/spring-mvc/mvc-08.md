---
slug: "mvc-08"
topic: "spring-mvc"
tier: DEEP
difficulty: 2
title: "Filter, HandlerInterceptor, AOP는 각각 어디에 위치하고 언제 쓰나요?"
keywords: ["Filter", "HandlerInterceptor", "AOP", "Servlet 레벨 vs MVC 레벨 vs 빈 메서드 레벨", "실행 순서"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
"위치가 다릅니다. Filter는 Servlet 스펙으로, DispatcherServlet 앞뒤에서 요청 전체를 감쌉니다. 어떤 컨트롤러가 처리할지는 모르고, 인코딩, CORS, 인증·보안(Spring Security), 로깅처럼 MVC 이전 레벨의 공통 처리에 씁니다. HandlerInterceptor는 Spring MVC 안에서 핸들러 실행 전후에 끼어들며 어떤 핸들러인지 알 수 있어서, 경로 패턴별 공통 처리나 핸들러 정보가 필요한 로직에 씁니다. AOP는 Servlet이나 MVC와 무관하게 스프링 빈 메서드 호출을 프록시로 감싸는 방식이라, 트랜잭션, 서비스 계층 로깅 같은 횡단 관심사에 씁니다. 요청 흐름 순서는 Filter, DispatcherServlet, Interceptor, 컨트롤러(그리고 그 안의 AOP 프록시), 서비스(AOP 프록시) 순입니다."

- (공식 문서) Filter: Servlet `Filter`는 나머지 필터 체인과 대상 Servlet의 앞뒤에서 인터셉션 로직을 적용하며, `OncePerRequestFilter`, `ForwardedHeaderFilter`, `CorsFilter`, `ShallowEtagHeaderFilter` 등을 제공합니다. Spring Security 사용 시 `CorsFilter`는 Security 필터 체인보다 앞에 두라고 권장합니다.
- (공식 문서) Interceptor: `WebMvcConfigurer.addInterceptors`로 등록하며 `addPathPatterns`/`excludePathPatterns`를 지원합니다. 보안 계층으로는 어노테이션 컨트롤러의 경로 매칭과 불일치할 수 있어 적합하지 않고, Servlet 필터 체인에 통합된 Spring Security를 가능한 한 일찍 적용하라고 안내합니다.
- (보충) AOP 위치와 설명은 일반 지식입니다. 이번에 읽은 MVC 문서 범위 밖입니다.
- (실험 확인) 필터는 매핑된 컨트롤러가 없는 URL(404)에서도 항상 실행됩니다. 인터셉터는 "컨트롤러가 있는 요청에만" 도는 것이 아닙니다. 인터셉터 경로 패턴에 걸리는 URL이면 매핑된 컨트롤러가 없어도 실행됩니다. `/**`로 매핑되는 정적 리소스 핸들러(`ResourceHttpRequestHandler`)가 핸들러로 취급되기 때문입니다. 즉 인터셉터는 "핸들러가 결정된 요청"에서 돌고, 정적 리소스 핸들러도 핸들러에 포함됩니다. 확인 테스트: `experiment/mvc/MvcFilterInterceptorTest`.

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
