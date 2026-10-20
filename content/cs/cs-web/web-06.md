---
slug: "web-06"
topic: "cs-web"
tier: BASIC
difficulty: 1
title: "HTTPS 는 무엇을 보장하고, 클라이언트는 서버 인증서를 어떻게 검증하나요?"
keywords: ["서버 인증·기밀성·무결성", "인증서가 URI 호스트와 일치", "신뢰 앵커 설정", "검증 실패 시 연결 종료", "데이터 길이는 숨기지 않음"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.rfc-editor.org/rfc/rfc9110.html", "https://www.rfc-editor.org/rfc/rfc9846.html", "https://www.rfc-editor.org/rfc/rfc8446.html"]
---
**모범 답변 (30~60초)**
HTTPS는 HTTP를 TLS 위에서 쓰는 것이고, TLS는 인증, 기밀성, 무결성 세 가지를 제공합니다. 서버는 항상 인증되고 클라이언트 인증은 선택이며, 연결이 맺어진 뒤의 데이터는 종단 사이에서만 보이고 중간에서 바꾸면 탐지됩니다. 인증서 검증에서 클라이언트는 미리 설정된 신뢰 앵커를 기준으로 서버 인증서를 확인하고, 그 인증서가 접속하려는 URI의 호스트, 즉 DNS 이름이나 IP 주소에 유효한지 확인해야 합니다. 맞지 않으면 사용자 확인을 받거나 연결을 끊어야 하고, 자동화된 클라이언트는 오류를 로그에 남기고 연결을 끊는 것이 권장됩니다. 다만 TLS가 데이터 길이까지 숨겨 주지는 않습니다.

```
1 신뢰하는 CA + 호스트 일치     : 성공 (TLSv1.3, TLS_AES_256_GCM_SHA384)
2 신뢰하는 CA + 다른 호스트 이름 : Hostname mismatch, certificate is not valid for 'other.test'
3 CA 를 신뢰 목록에 넣지 않음    : unable to get local issuer certificate
4 검증을 끔                      : 연결 성공 (서버가 누구인지 확인 안 함)
```

(공식 문서) RFC 9846 1절(RFC 8446 1절에도 같은 서술)은 TLS가 서버는 항상 인증되고 클라이언트는 선택인 인증, 종단에서만 보이는 기밀성(데이터 길이는 숨기지 않으며 패딩으로 완화 가능), 탐지 없이 변경할 수 없는 무결성을 제공한다고 한다. RFC 9110 4.3.4는 https URI에 접속할 때 클라이언트가 서비스 신원이 URI의 원 서버에 맞는지 MUST 검증해야 하고 이를 위해 신뢰 앵커 집합이 설정돼 있어야 하며, 호스트가 이름이면 DNS-ID, IP 주소면 IP-ID를 기준으로 하고 CN-ID는 쓰면 안 된다고 한다. 인증서가 맞지 않으면 사용자 에이전트는 사용자 확인을 받거나 연결을 끝내야 하고, 자동화 클라이언트는 감사 로그에 오류를 남겨야(MUST) 하고 연결을 끊는 것이 SHOULD 다. 검증 절차 자체는 RFC 6125 6절을 따르라고 한다. 검증을 끄는 것은 능동적 공격에 열려 있게 된다고 경고한다. RFC 9846 4.5.1.3은 상세한 인증서 검증 절차는 TLS 범위 밖이고 RFC 5280 소관이라고 한다.
(실험 확인) 위 블록은 Python 3.14(OpenSSL 3.0.18) ssl 모듈로 만든 루프백 TLS 서버와 클라이언트의 결과다. 내가 만든 임시 CA 로 서명한 SAN=example.test 인증서를 썼다. 서버는 TLS 1.3 이상만 받게 했고, 클라이언트를 TLS 1.2 로 제한하면 protocol version 알림으로 실패했다.
