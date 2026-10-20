---
slug: "sec-06"
topic: "spring-security"
tier: BASIC
difficulty: 1
title: "authorizeHttpRequests의 규칙은 어떤 순서로 평가되나요?"
keywords: ["첫 번째로 일치", "anyRequest", "hasRole", "ROLE_", "denyAll"]
has_extra: false
status: DRAFT
sources: ["https://docs.spring.io/spring-security/reference/servlet/authorization/authorize-http-requests.html", "https://docs.spring.io/spring-security/reference/servlet/authorization/architecture.html"]
---
**모범 답변 (30~60초)**
선언한 순서대로 평가되고 요청에 첫 번째로 일치하는 규칙 하나만 적용됩니다. 그래서 구체적인 규칙을 먼저, 일반적인 규칙을 뒤에 두고 마지막에 anyRequest로 마무리해야 합니다. hasRole("ADMIN")은 ROLE_ 접두사를 붙인 hasAuthority("ROLE_ADMIN")의 단축형이라, hasAllAuthorities처럼 권한 이름을 직접 쓰는 메서드에서는 ROLE_를 명시해야 합니다. 문서는 마지막을 anyRequest().denyAll()로 두어 허용 목록 방식으로 구성하는 것을 안전한 기본값으로 소개합니다. 매칭은 경로만 보기 때문에 쿼리 파라미터로 구분하려면 커스텀 RequestMatcher가 필요합니다.

```java
http.authorizeHttpRequests((authorize) -> authorize
    .requestMatchers("/admin/**").hasRole("ADMIN")
    .requestMatchers("/static/**", "/signup").permitAll()
    .anyRequest().denyAll()
);
```

(공식 문서) authorizeHttpRequests 페이지에 근거한다. FORWARD와 ERROR 디스패치도 인가를 받으므로 보통 permitAll로 열어 두라는 안내가 같은 페이지에 있다.
