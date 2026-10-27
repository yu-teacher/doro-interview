---
slug: "aut-07"
topic: "security-auth"
tier: BASIC
difficulty: 1
title: "SSO(Single Sign-On)는 어떤 방식으로 동작하나요?"
keywords: ["한 번 인증으로 여러 서비스 사용", "IdP와 RP", "어서션 전달", "서비스는 자기 세션 생성", "서비스마다 인증기를 따로 두지 않음"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://pages.nist.gov/800-63-4/sp800-63c.html", "https://openid.net/specs/openid-connect-core-1_0.html"]
concepts: [oauth-oidc]
importance: 2
links: [{to: "aut-06", kind: PREREQ}]
---
**모범 답변 (30~60초)**
SSO는 한 번 인증한 계정으로 여러 애플리케이션을 다시 로그인하지 않고 쓰는 방식입니다. 보통 신원 제공자인 IdP가 사용자를 인증하고, 서비스 쪽인 RP는 IdP가 보낸 어서션, 즉 검증 가능한 사용자 정보를 확인해 자기 세션을 만듭니다. 그래서 RP는 비밀번호 같은 인증기를 직접 검증하지 않고, 사용자도 서비스마다 인증기를 따로 두지 않아도 됩니다. 이런 연동을 하는 페더레이션 프로토콜로는 OpenID Connect와 SAML이 예로 꼽힙니다. 다만 NIST는 RP 쪽 세션을 끝내도 IdP 쪽 세션은 끝나지 않을 수 있다고 안내합니다.

(공식 문서) NIST SP 800-63C(2025)는 페더레이션을 RP가 사용자의 인증기를 직접 검증하지 않고 사용자를 인증하는 과정으로 설명한다. IdP가 인증 사건을 계기로 어서션을 RP에 보내고, RP는 어서션을 검증해 사용자와 인증된 세션을 만든다. 이 과정으로 사용자는 RP마다 인증기를 갖지 않고 여러 RP의 서비스를 받을 수 있으며 이를 흔히 SSO라 부른다고 하고, 용어집은 SSO를 하나의 계정과 인증기로 여러 애플리케이션에 매끄럽게 접근하는 인증 과정으로 정의한다.
(공식 문서) NIST SP 800-63C 1은 페더레이션이 한 보안 도메인 안에서도 계정 관리의 중앙화와 기술 통합 같은 이점이 있다고 하고, 2절은 어서션의 예로 OpenID Connect의 ID 토큰과 SAML 어서션을 든다. 8절(고객 경험)은 페더레이션 로그인이 IdP와 RP 양쪽에 장기 세션을 만들 수 있고, RP와의 세션을 끝내도 IdP와의 세션이 반드시 끝나지는 않아 사용자가 IdP에서 따로 로그아웃해야 한다는 점을 사용자가 알도록 해야 한다고 설명한다.
(공식 문서) OpenID Connect Core 1.0 1은 OpenID Connect가 인가 서버가 수행한 인증에 근거해 클라이언트가 사용자의 신원을 확인하게 해 준다고 한다. Core 15.7절은 RP 주도 로그아웃과 세션 관리를 다루는 별도의 관련 사양을 소개한다. 이 단계에서 SAML 사양 자체는 읽지 않았다.
