---
slug: "cry-15"
topic: "security-crypto"
tier: DEEP
difficulty: 2
title: "클라이언트는 서버 인증서를 어떻게 검증하나요? 인증서 체인과 루트 CA는 어떤 역할인가요?"
keywords: ["신뢰 앵커에서 시작하는 경로", "각 인증서 서명을 상위 공개키로 검증", "유효기간·폐기 확인", "중간 CA 인증서도 전송", "호스트 이름 일치 확인"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://www.rfc-editor.org/rfc/rfc5280.html", "https://www.rfc-editor.org/rfc/rfc8446.html", "https://www.rfc-editor.org/rfc/rfc9110.html"]
concepts: [tls-pki]
importance: 2
links: [{to: "cry-14", kind: PREREQ}, {to: "web-06", kind: RELATED}]
---
**모범 답변 (30~60초)**
서버는 자기 인증서와 중간 CA 인증서를 함께 보내고, 클라이언트는 이미 신뢰하는 루트인 신뢰 앵커에서 시작해 서버 인증서까지 이어지는 경로를 검증합니다. RFC 5280은 각 인증서의 서명을 상위 인증서의 공개키로 확인하고, 유효기간이 지금을 포함하며, 폐기되지 않았고, 발급자 이름이 이어지는지를 보게 합니다. 중간 CA 인증서는 CA로 표시되어 있어야 합니다. 이 경로 검증과 별도로 클라이언트는 접속하려는 호스트 이름이 인증서의 이름과 맞는지도 확인해야 합니다.

```
openssl verify (루트 + 중간 CA + 리프)           -> OK
openssl verify (루트 + 리프, 중간 CA 없음)      -> unable to get local issuer certificate
JDK 25 TLS: 서버가 리프만 전송                     -> PKIX path building failed
JDK 25 TLS: localhost 로 접속(SAN: localhost)      -> 성공
JDK 25 TLS: 127.0.0.1 로 접속                      -> No subject alternative names matching IP address
```

(공식 문서) RFC 5280 의 6.1 은 경로 검증의 조건으로 각 인증서의 주체가 다음 인증서의 발급자이고, 첫 인증서는 신뢰 앵커가 발급했으며, 모든 인증서가 해당 시점에 유효해야 한다고 하고, 6.1.3 은 서명을 작업 공개키로 검증하고 유효기간이 현재 시각을 포함하며 폐기되지 않았고 발급자 이름이 일치할 것을 요구한다. 신뢰 앵커는 알고리즘의 입력이고 자체 서명 인증서면 경로에 포함하지 않는다. 4.2.1.9 는 `cA` 가 참이 아닌 인증서의 공개키로는 인증서 서명을 검증하면 안 된다고 한다. RFC 8446 의 4.4.2 는 인증서 목록에서 송신자 인증서가 첫 항목이고 이후 인증서가 앞 인증서를 직접 인증해야 하며(SHOULD), 신뢰 앵커 인증서는 상대가 갖고 있음을 알면 생략할 수 있다고 한다. RFC 9110 의 4.3.4 는 클라이언트가 서비스의 신원이 URI 의 원 서버와 맞는지 검증해야 하며 RFC 6125 의 절차를 쓰고 신뢰 앵커 집합이 설정되어 있어야 한다고 한다.
(실험 확인) LibreSSL 3.3.6 `openssl` 로 만든 테스트용 루트, 중간 CA, 리프(SAN `localhost`) 체인에 대해 `openssl verify` 와 JDK 25 `SSLSocket`(HTTPS 호스트 이름 검증 켬)의 위 결과를 인증서를 새로 만들어 다시 실행해 확인했다. 폐기 확인과 만료 검증은 실행하지 않았다.
