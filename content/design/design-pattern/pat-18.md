---
slug: "pat-18"
topic: "design-pattern"
tier: BASIC
difficulty: 2
title: "어댑터 패턴은 무엇이고, 스프링 MVC의 `HandlerAdapter`와 `Arrays.asList`는 어떤 예인가요?"
keywords: ["인터페이스를 다른 인터페이스로 변환", "서버 인터페이스 변환 위임", "호출을 번역해 위임", "핸들러 타입에 독립적인 DispatcherServlet", "배열을 리스트로 보이게 함"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://alistair.cockburn.us/hexagonal-architecture/", "https://objectmentor.com/resources/articles/Principles_and_Patterns.pdf", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/HandlerAdapter.html", "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet/special-bean-types.html", "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/Arrays.html"]
concepts: [gof-patterns, mvc-request-flow]
importance: 2
links: [{to: "pat-20", kind: RELATED}]
---
**모범 답변 (30~60초)**
어댑터는 한 클래스의 인터페이스를 클라이언트가 기대하는 다른 인터페이스로 바꿔 주는 패턴으로, Cockburn이 GoF의 정의를 이렇게 인용합니다. Martin은 어댑터가 추상 인터페이스를 구현하면서 모든 메서드를 번역해 서버에 위임하는 객체라고 설명합니다. 스프링 MVC의 `HandlerAdapter`는 핸들러가 실제로 어떻게 호출되는지를 `DispatcherServlet`에서 가려 주므로, 서블릿은 특정 핸들러 타입에 특화된 코드를 갖지 않습니다. JDK의 `Arrays.asList`는 배열 기반 API와 컬렉션 기반 API를 잇는 다리로, 배열을 감싼 `List`를 돌려줍니다.

```java
String[] arr = {"x", "y"};
List<String> adapted = Arrays.asList(arr);
adapted.set(0, "z");        // arr 도 [z, y] 로 바뀜
adapted.add("q");           // UnsupportedOperationException (크기 고정)
```

(원저자 자료) Cockburn, Hexagonal Architecture 글의 "Related Patterns" 절은 GoF의 Adapter 패턴을 클래스의 인터페이스를 클라이언트가 기대하는 다른 인터페이스로 변환하는 것으로 인용하고, 포트와 어댑터 패턴이 그 사용례라고 한다. Martin, Design Principles and Design Patterns(2000), 쪽 번호(머리글 기준) 29의 "Adapter" 절: 서버가 서드파티라 추상 인터페이스를 끼워 넣기 어려울 때 추상 인터페이스를 구현해 서버에 위임하는 어댑터를 쓰며, 어댑터의 모든 메서드는 번역한 뒤 위임한다고 한다.
(공식 문서) `HandlerAdapter` API 문서는 핸들러 타입마다 구현하며, `DispatcherServlet`이 설치된 모든 핸들러를 이 인터페이스로 접근하므로 특정 핸들러 타입에 특화된 코드를 갖지 않고 끝없이 확장될 수 있다고 한다. Special Bean Types 페이지는 `HandlerAdapter`가 핸들러가 실제로 호출되는 방식과 무관하게 호출을 도우며, 어노테이션 컨트롤러 호출에 필요한 세부를 `DispatcherServlet`에서 가리는 것이 주목적이라고 한다. `Arrays.asList` 문서는 배열이 뒷받침하는 고정 크기 리스트이며 서로 변경이 보이고, 크기를 바꾸는 연산은 `UnsupportedOperationException`이라고 하며 배열 기반 API와 컬렉션 기반 API의 다리 역할을 한다고 한다.
(실험 확인) 위 코드에서 `set`한 값이 원래 배열에도 나타났고, 반대로 배열을 고치면 리스트에도 보였다. `add`는 `UnsupportedOperationException`이었다.
(보충) 두 API 문서는 스스로를 어댑터 패턴이라고 부르지 않는다. 대응은 위 정의에 비추어 본 해석이다.
