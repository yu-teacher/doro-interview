---
slug: "mvc-01"
topic: "spring-mvc"
tier: BASIC
difficulty: 1
title: "Spring MVC에서 요청이 들어와 응답이 나가기까지의 흐름을 설명해 주세요."
keywords: ["DispatcherServlet", "HandlerMapping", "HandlerAdapter", "ArgumentResolver", "HttpMessageConverter", "ViewResolver", "HandlerExceptionResolver"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
"모든 요청은 Servlet 컨테이너를 거쳐 `DispatcherServlet` 하나로 들어옵니다. DispatcherServlet은 `HandlerMapping`에게 이 요청을 처리할 핸들러, 보통은 `@RequestMapping`이 붙은 컨트롤러 메서드와 인터셉터 목록을 찾아달라고 합니다. 그다음 `HandlerAdapter`가 그 핸들러를 실제로 호출하는데, 이때 ArgumentResolver가 `@PathVariable`, `@RequestBody` 같은 파라미터를 만들어 주고, 반환값은 ReturnValueHandler가 처리합니다. `@ResponseBody`나 `@RestController`면 `HttpMessageConverter`가 객체를 JSON으로 바꿔 바로 응답 본문에 씁니다. 뷰 기반 컨트롤러면 뷰 이름이 `ViewResolver`를 거쳐 View로 렌더링됩니다. 중간에 예외가 나면 `HandlerExceptionResolver` 체인이 이를 처리합니다."

- (공식 문서) 처리 순서는 컨텍스트·로케일 리졸버 바인딩, 멀티파트 처리, 핸들러 탐색과 실행 체인(전처리기, 후처리기, 컨트롤러) 실행, 모델이 있으면 뷰 렌더링 순입니다. 어노테이션 컨트롤러는 `HandlerAdapter`가 뷰 없이 응답을 직접 쓸 수 있습니다. 처리 중 예외는 `HandlerExceptionResolver` 빈들이 해결합니다.
- (공식 문서) 특수 빈 타입 표: `HandlerMapping`은 요청을 핸들러와 인터셉터 목록에 매핑하고, `HandlerAdapter`는 핸들러 호출 방식의 세부사항(어노테이션 해석 등)을 DispatcherServlet으로부터 숨겨 줍니다. 주요 `HandlerMapping` 구현은 `RequestMappingHandlerMapping`과 `SimpleUrlHandlerMapping`입니다.
- (보충) 파라미터 해석은 `HandlerMethodArgumentResolver`, 반환값 처리는 `HandlerMethodReturnValueHandler` 구현체들이 담당하며 `RequestMappingHandlerAdapter`가 이들을 들고 있습니다.
