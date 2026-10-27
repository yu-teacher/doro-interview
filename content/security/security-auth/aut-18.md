---
slug: "aut-18"
topic: "security-auth"
tier: TRICKY
difficulty: 3
title: "OAuth 2.0의 Implicit 방식과 Resource Owner Password Credentials 방식을 왜 쓰지 말라고 하나요?"
keywords: ["implicit은 URL로 토큰 전달", "토큰 누출과 재사용 위험", "인가 코드 방식으로 대체", "ROPC는 비밀번호를 클라이언트에 노출", "다단계 인증과 맞지 않음"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://www.rfc-editor.org/rfc/rfc9700.html"]
concepts: [oauth-oidc]
importance: 1
links: [{to: "aut-11", kind: PREREQ}]
---
**모범 답변 (30~60초)**
RFC 9700, 즉 OAuth 2.0 보안 모범 사례가 둘 다 피하라고 정리합니다. 암시적 방식은 액세스 토큰을 인가 응답 URL로 바로 돌려주기 때문에 토큰이 누출되고 재사용될 위험이 있고, 토큰을 발신자에 묶는 표준 방법도 없습니다. 그래서 쓰지 않아야 하고(SHOULD NOT) 인가 코드 방식을 쓰라고 합니다. 비밀번호 방식은 사용자 자격 증명이 인가 서버가 아닌 클라이언트에 노출되고 사용자가 다른 곳에 비밀번호를 입력하는 습관이 들며, 다단계 인증과 맞지 않고 WebAuthn 같은 암호 자격 증명은 구현하기 어려울 수 있어 아예 쓰면 안 됩니다(MUST NOT).

(공식 문서) RFC 9700 2.1.2는 implicit(response type token)와 인가 응답으로 액세스 토큰을 발급하는 응답 유형이 토큰 누출과 재사용에 취약하고, 인가 응답으로 발급된 토큰에는 발신자 제한의 표준 방법이 없다고 한다. 그래서 토큰 주입이 막히고 누출 경로가 완화된 경우가 아니면 쓰지 않아야 하고(SHOULD NOT), 대신 `code` 응답 유형을 쓰라고 한다. 2.4는 비밀번호 자격 증명 방식을 쓰면 안 된다(MUST NOT)고 하며 이유로 사용자 자격 증명이 클라이언트에 노출되는 점, 공격 표면이 커지는 점, 사용자가 인가 서버 아닌 곳에 자격 증명을 입력하도록 훈련되는 점, 2단계 인증과 여러 단계가 필요한 인증에 맞게 설계되지 않았다는 점, WebAuthn류 암호 자격 증명은 이 방식으로 구현이 불가능할 수 있다는 점을 든다.
