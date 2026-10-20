---
slug: "web-14"
topic: "cs-web"
tier: DEEP
difficulty: 3
title: "TLS 1.3 핸드셰이크는 어떤 순서로 진행되고 0-RTT 는 무엇이 위험한가요?"
keywords: ["ClientHello의 key_share", "ServerHello 이후 암호화", "Certificate·CertificateVerify·Finished", "1-RTT 핸드셰이크", "0-RTT 재전송 위험"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.rfc-editor.org/rfc/rfc9846.html", "https://www.rfc-editor.org/rfc/rfc8446.html"]
---
**모범 답변 (30~60초)**
클라이언트가 ClientHello에 지원하는 암호 목록과 Diffie-Hellman 키 공유 값을 담아 보내면, 서버가 ServerHello로 선택한 파라미터와 자기 키 공유 값을 답하고 여기서 공유 비밀이 만들어져 이후 메시지는 모두 암호화됩니다. 이어서 서버가 EncryptedExtensions, Certificate, CertificateVerify, Finished를 보냅니다. CertificateVerify는 인증서의 개인키를 가졌다는 서명 증명이고 Finished는 핸드셰이크 전체에 대한 MAC입니다. 클라이언트가 Finished를 보내면 끝나서 완전 핸드셰이크는 1-RTT입니다. 이전 연결의 PSK가 있으면 첫 비행에 데이터를 싣는 0-RTT가 가능하지만, 전방 비밀성을 보장하지 않고 연결 간 재전송 방지 보장도 없어서 클라이언트는 재전송돼도 안전한 데이터만 보내야 합니다.

```
openssl s_client -tls1_3 -msg (LibreSSL 3.3.6) 로 본 메시지 순서
>>> ClientHello
<<< ServerHello
<<< EncryptedExtensions
<<< Certificate
<<< CertificateVerify
<<< Finished
>>> Finished
(두 번째 연결, 저장한 세션 사용) session_reused = True
```

(공식 문서) RFC 9846 2절(개정 전 RFC 8446 2절도 같은 흐름도)은 ClientHello가 난수, 제안 프로토콜 버전, 암호·해시 쌍 목록, 키 공유 확장(또는 PSK)을 담고, 서버가 ServerHello로 파라미터를 정해 두 메시지의 조합이 공유 키를 결정하며 그 뒤 메시지가 암호화된다고 한다. 서버 파라미터는 EncryptedExtensions(와 선택적 CertificateRequest)이고, 인증 메시지는 Certificate, CertificateVerify(핸드셰이크 전체에 대한 서명), Finished(전체 핸드셰이크에 대한 MAC)다. 2.3은 PSK가 있으면 첫 비행에 early data를 보낼 수 있다고 하고, 이 데이터에 전방 비밀성 보장이 없고(RFC 8446 2.3은 '전방 비밀이 아니다'라고 더 단정적으로 쓰고, RFC 9846 은 서버 동작에 따라 달라지므로 클라이언트가 전방 비밀이 아니라고 가정하라고 완화했다) 연결 간 재전송 방지 보장이 없다고 경고한다. RFC 는 이 흐름과 PSK 재개 흐름을 모두 1-RTT 핸드셰이크라 부른다(2.3, 4.3.10). 8절은 서버가 상태 공유 등으로 재전송 방어를 해야(SHOULD) 하지만 모든 배포가 그러지는 않으므로 클라이언트는 재전송돼도 안전하다고 판단하는 early data 만 보내야(MUST) 한다고 한다. RFC 8446 은 RFC 9846 으로 대체(obsolete)됐다.
(실험 확인) 위 메시지 순서는 LibreSSL 3.3.6 의 openssl s_client/s_server 를 루프백(127.0.0.1)에서 돌려 얻었다(이 클라이언트는 암호화된 핸드셰이크 메시지 이름까지 보여 줬다). Python 3.14(OpenSSL 3.0.18)로 만든 루프백 TLS 1.3 서버와 클라이언트는 TLS_AES_256_GCM_SHA384 로 협상했고, 첫 연결에서 받은 세션을 두 번째 연결에 넘기자 session_reused 가 True 였다. 0-RTT early data 전송 자체는 실행하지 않았다.
