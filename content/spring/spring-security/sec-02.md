---
slug: "sec-02"
topic: "spring-security"
tier: BASIC
difficulty: 1
title: "SecurityContextHolder, SecurityContext, Authentication은 어떤 관계인가요?"
keywords: ["SecurityContextHolder", "ThreadLocal", "Authentication", "principal", "createEmptyContext"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-security/reference/servlet/authentication/architecture.html", "https://docs.spring.io/spring-security/reference/servlet/architecture.html"]
---
**모범 답변 (30~60초)**
SecurityContextHolder는 현재 인증된 사용자가 누구인지 보관하는 곳이고, 그 안의 SecurityContext가 Authentication 객체를 들고 있습니다. 기본 저장 전략은 ThreadLocal이라 같은 스레드에서는 인자로 넘기지 않아도 꺼내 쓸 수 있고, FilterChainProxy가 요청이 끝나면 비워 줍니다. Authentication은 사용자를 식별하는 principal, 보통 인증 뒤에는 지워지는 credentials, 권한을 나타내는 authorities 세 가지를 담습니다. 직접 설정할 때는 기존 컨텍스트에 setAuthentication을 호출하지 말고 createEmptyContext로 새 컨텍스트를 만들어 넣으라고 문서가 안내하는데, 스레드 간 경쟁 상태를 피하기 위해서입니다.

```java
SecurityContext context = SecurityContextHolder.createEmptyContext();
context.setAuthentication(authentication);
SecurityContextHolder.setContext(context);
```

(공식 문서) 서블릿 인증 아키텍처 페이지에 근거한다. 다른 전략으로 MODE_GLOBAL과 MODE_INHERITABLETHREADLOCAL이 있고 시스템 속성이나 정적 메서드로 바꾼다.
