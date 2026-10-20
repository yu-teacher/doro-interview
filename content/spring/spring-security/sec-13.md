---
slug: "sec-13"
topic: "spring-security"
tier: DEEP
difficulty: 2
title: "JWT 리소스 서버는 기본으로 어떤 검증을 하고 권한은 어떻게 만드나요?"
keywords: ["JwtDecoder", "issuer-uri", "SCOPE_", "aud", "60초"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html", "https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/index.html"]
concepts: [web-security, authn-authz]
importance: 2
links: [{to: "sec-01", kind: PREREQ}]
---
**모범 답변 (30~60초)**
Authorization 헤더의 Bearer 토큰으로 BearerTokenAuthenticationToken이 만들어지고, JwtAuthenticationProvider가 JwtDecoder로 Jwt를 디코딩하고 검증한 뒤 JwtAuthenticationConverter로 권한을 만듭니다. 기본 검증은 exp와 nbf 타임스탬프로 시계 오차 허용은 기본 60초이고, issuer-uri를 설정하면 iss도 확인합니다. aud 검증은 부트의 audiences 속성이나 프로그래밍 방식 검증기로 따로 추가하며, 문서의 기본 검증 목록에는 aud가 없습니다. 권한은 scope 또는 scp 클레임의 각 값에 SCOPE_ 접두사를 붙여 만들고, Authentication의 이름은 sub 클레임입니다.

(공식 문서) JWT 리소스 서버 페이지에 근거한다. 서명 검증은 기본으로 RS256을 신뢰한다. 이 페이지에는 세션이나 CSRF 기본 동작에 대한 설명이 없다.
