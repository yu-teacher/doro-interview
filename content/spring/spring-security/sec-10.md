---
slug: "sec-10"
topic: "spring-security"
tier: DEEP
difficulty: 2
title: "세션 고정 보호의 기본 동작은 무엇이고, STATELESS 정책은 무엇을 바꾸나요?"
keywords: ["세션 고정", "changeSessionId", "STATELESS", "NullSecurityContextRepository", "NEVER"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-security/reference/servlet/authentication/session-management.html"]
---
**모범 답변 (30~60초)**
세션 고정 보호의 기본값은 서블릿 3.1 이상 컨테이너에서 changeSessionId이고, 로그인 때 기존 세션의 ID만 바꿔 세션 고정 공격을 막습니다. 그 밖에 새 세션을 만드는 newSession, 속성을 복사하는 migrateSession이 있고, none은 보호를 끄므로 권장되지 않는다고 합니다. 세션 생성 정책을 STATELESS로 두면 NullSecurityContextRepository가 설정되어 요청이 세션에 저장되지 않습니다. SessionCreationPolicy.NEVER를 써도 세션이 생기는 경우가 있는데, 문서는 대부분 인증 성공 뒤 다시 요청하기 위해 요청을 세션에 저장하기 때문이라고 설명합니다.

(공식 문서) 세션 관리 페이지에 근거한다. maxSessionsPreventsLogin(true)로 두 번째 로그인을 막을 수도 있다. 보안 컨텍스트는 기본적으로 HTTP 세션에 저장되며, Spring Security 6부터는 SecurityContext를 명시적으로 저장하는 것이 기본 동작이다.
