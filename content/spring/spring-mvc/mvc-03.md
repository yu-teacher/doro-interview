---
slug: "mvc-03"
topic: "spring-mvc"
tier: BASIC
difficulty: 1
title: "`@Controller`와 `@RestController`의 차이는 무엇인가요?"
keywords: ["@Controller", "@RestController", "@ResponseBody", "뷰 이름", "HttpMessageConverter"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/responsebody.html", "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/return-types.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/bind/annotation/RestController.html"]
concepts: [mvc-request-flow]
importance: 3
links: [{to: "mvc-04", kind: FOLLOWUP}, {to: "mvc-05", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
`@RestController`는 `@Controller`와 `@ResponseBody`를 함께 붙인 메타 어노테이션일 뿐입니다. `@Controller` 메서드가 `String`을 반환하면 뷰 이름으로 간주되어 `ViewResolver`가 실제 View로 해석하고 렌더링합니다. `@RestController`는 클래스 수준 `@ResponseBody`가 모든 메서드에 상속되므로, 반환값이 `HttpMessageConverter`를 거쳐 응답 본문에 바로 쓰입니다. 그래서 같은 `String` 반환이라도 `@RestController`에서는 뷰 이름이 아니라 본문 문자열이 됩니다. JSON API는 `@RestController`, 모델을 템플릿 뷰로 렌더링하는 화면 응답은 `@Controller`를 씁니다.

- (공식 문서, @ResponseBody) `@ResponseBody`는 반환값을 `HttpMessageConverter`로 응답 본문에 직렬화하게 한다. 클래스 수준에도 붙일 수 있고 그러면 모든 컨트롤러 메서드가 상속한다. `@RestController`의 효과가 바로 이것이며, `@Controller`와 `@ResponseBody`를 메타 어노테이션으로 가진 것에 불과하다.
- (공식 문서, 반환값 표) 반환 타입 `String`은 `ViewResolver`가 해석할 뷰 이름이다. `@RestController` Javadoc도 `@RequestMapping` 메서드가 기본적으로 `@ResponseBody` 의미를 갖는다고 설명한다.
- (실험 확인) `@RestController`의 `String` 반환 메서드를 호출하면 뷰 해석 없이 반환한 문자열이 응답 본문으로 나온다.

```java
@RestController                       // = @Controller + @ResponseBody
@RequestMapping("/api/members")
public class MemberController {
    @GetMapping("/ping")
    public String ping() { return "pong"; }   // 응답 본문: pong
}
```
