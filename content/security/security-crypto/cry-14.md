---
slug: "cry-14"
topic: "security-crypto"
tier: DEEP
difficulty: 2
title: "TLS 1.3은 어떤 보안 속성을 제공하고, 핸드셰이크에서는 무슨 일이 일어나나요?"
keywords: ["인증·기밀성·무결성", "핸드셰이크와 레코드 프로토콜", "Diffie-Hellman 키 공유로 키 합의", "서버 인증서로 인증", "AEAD로 레코드 보호"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://www.rfc-editor.org/rfc/rfc8446.html"]
concepts: [tls-pki]
importance: 2
links: [{to: "cry-12", kind: PREREQ}, {to: "cry-15", kind: FOLLOWUP}, {to: "web-14", kind: RELATED}, {to: "web-06", kind: RELATED}]
---
**모범 답변 (30~60초)**
TLS 1.3의 목표는 두 통신 상대 사이에 인증, 기밀성, 무결성을 갖춘 안전한 채널을 만드는 것이고, 핸드셰이크 프로토콜과 레코드 프로토콜 두 부분으로 이뤄집니다. 핸드셰이크에서 양쪽이 사용할 알고리즘을 협상하고 보통 Diffie-Hellman 키 공유로 공유 키 재료를 만들며(사전 공유 키 모드도 있습니다), 서버는 인증서와 서명으로 자신을 증명합니다. 이후 레코드 프로토콜이 그 키로 데이터를 AEAD 알고리즘으로 보호합니다. 서버는 항상 인증되고 클라이언트 인증은 선택입니다.

```
JDK 25 클라이언트 -> 로컬 TLS 서버(OpenSSL 3.0.18, 자체 CA 체인)
protocol=TLSv1.3  suite=TLS_AES_256_GCM_SHA384
```

(공식 문서) RFC 8446 의 1절은 TLS 의 주 목표를 두 상대 간 안전한 채널로 정하고, 속성으로 서버는 항상 인증되고 클라이언트는 선택이며, 연결 수립 후 데이터는 끝점에게만 보이고, 변조는 탐지 없이 불가능하다고 설명한다. 같은 절은 핸드셰이크가 상대를 인증하고 암호 모드와 매개변수를 협상하며 공유 키 재료를 만들고, 레코드 프로토콜이 그 매개변수로 트래픽을 보호한다고 한다. 2절은 키 교환 모드로 (EC)DHE, PSK 단독, PSK 와 (EC)DHE 를 들고, 인증서 인증에서는 Certificate 메시지와 그 개인키로 핸드셰이크 전체에 서명한 CertificateVerify 메시지를 쓴다고 한다. 5.2절은 TLS 1.3 에서 모든 암호가 AEAD 로 모델링된다고 하고, 1.2절은 남은 대칭 암호가 모두 AEAD 이며 ServerHello 이후 핸드셰이크 메시지가 암호화된다고 한다.
(실험 확인) Python 3.14(OpenSSL 3.0.18) 로 `localhost` 에 TLS 서버를 띄우고 JDK 25 클라이언트로 접속해 `TLSv1.3`, `TLS_AES_256_GCM_SHA384` 가 협상되는 것을 다시 실행해 확인했다. 어떤 스위트가 고를지는 서버와 클라이언트 설정에 따른 결과이다.
