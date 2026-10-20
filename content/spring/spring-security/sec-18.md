---
slug: "sec-18"
topic: "spring-security"
tier: TRICKY
difficulty: 3
title: "@EnableMethodSecurity를 켜고 @PreAuthorize만 붙이면 보안이 충분한가요?"
keywords: ["@EnableMethodSecurity", "@PreAuthorize", "@PostAuthorize", "anyRequest", "Spring AOP"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-security/reference/servlet/authorization/method-security.html", "https://docs.spring.io/spring-security/reference/servlet/authorization/authorize-http-requests.html"]
concepts: [authn-authz, aop, proxy]
importance: 2
links: [{to: "aop-10", kind: RELATED}, {to: "tx-15", kind: RELATED}]
---
**모범 답변 (30~60초)**
충분하지 않을 수 있습니다. 먼저 Spring Boot 스타터 시큐리티는 메서드 수준 인가를 기본으로 켜지 않아서 @EnableMethodSecurity를 직접 붙여야 합니다. 이 어노테이션은 기본으로 @PreAuthorize, @PostAuthorize, @PreFilter, @PostFilter를 활성화하고, @Secured와 JSR-250은 옵션을 켜야 합니다. 어노테이션 기반이면 어노테이션이 없는 메서드는 보호되지 않으므로, 문서는 HttpSecurity에 anyRequest 같은 포괄(catch-all) 규칙을 두라고 합니다. 메서드 보안은 Spring AOP 기반이고 여러 어노테이션은 모두 통과해야 하며, 같은 메서드에 클래스 수준 어노테이션이 있으면 메서드 쪽이 덮어씁니다.

(공식 문서) 메서드 보안 페이지에 근거한다. 페이지 전체를 원문 텍스트로 확인했으며, 자기 호출(self-invocation) 제약은 이 페이지에서 찾지 못해 다루지 않았다.
