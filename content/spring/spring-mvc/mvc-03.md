---
slug: "mvc-03"
topic: "spring-mvc"
tier: BASIC
difficulty: 1
title: "`@Controller`와 `@RestController`의 차이는 무엇인가요?"
keywords: ["@Controller", "@RestController", "@ResponseBody", "뷰 이름", "HttpMessageConverter"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
"`@RestController`는 `@Controller`와 `@ResponseBody`를 합친 메타 어노테이션입니다. `@Controller`에서 `String`을 반환하면 뷰 이름으로 해석되어 `ViewResolver`를 거치지만, `@RestController`는 모든 메서드의 반환값을 `HttpMessageConverter`로 직렬화해 응답 본문에 바로 씁니다. 그래서 JSON API는 `@RestController`, 서버 사이드 렌더링(Thymeleaf 등)은 `@Controller`를 씁니다. 데모 프로젝트의 `MemberController`, `PostController`도 `@RestController`입니다."

- (공식 문서) `@RestController`는 `@Controller` + `@ResponseBody`의 편의 메타 어노테이션이고, 반환 타입 `String`은 뷰 이름으로 `ViewResolver`가 해석합니다.

```java
@RestController                       // = @Controller + @ResponseBody
@RequestMapping("/api/members")
public class MemberController { ... }
```
