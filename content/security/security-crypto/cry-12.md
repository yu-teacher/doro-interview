---
slug: "cry-12"
topic: "security-crypto"
tier: DEEP
difficulty: 2
title: "Diffie-Hellman 키 교환은 어떤 원리이고, 전방 비밀성(forward secrecy)은 무엇인가요?"
keywords: ["공개값만 교환해 같은 비밀 계산", "양쪽 기여로 키 결정", "임시 키 사용", "장기 키가 유출돼도 과거 세션 안전", "TLS 1.3은 정적 RSA·DH 제거"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-57pt1r5.pdf", "https://www.rfc-editor.org/rfc/rfc8446.html"]
concepts: [tls-pki, cryptography]
importance: 2
links: [{to: "cry-03", kind: PREREQ}, {to: "cry-14", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
Diffie-Hellman은 두 당사자가 각자 비밀값을 만들고 그에 대응하는 공개값만 주고받아도 양쪽이 같은 공유 비밀을 계산해 내는 키 합의 방식입니다. 합의된 키는 한쪽이 미리 정할 수 없고 양쪽 기여로 만들어집니다. 매 연결마다 새로 만든 임시 키를 쓰면 전방 비밀성이 생기는데, 서버의 장기 서명 키가 나중에 유출돼도 세션 키가 이미 지워졌다면 그 세션 키는 위협받지 않는다는 뜻입니다. TLS 1.3은 정적 RSA와 정적 DH 스위트를 없애서 공개키 기반 키 교환이 모두 전방 비밀성을 갖습니다.

```
X25519 / ECDH(P-256): 두 쪽이 서로의 공개키만 받아 계산한 비밀 일치 (32바이트)
```

(공식 문서) NIST SP 800-57 Part 1 Rev. 5 의 용어집은 키 합의를 둘 이상의 참여자가 기여한 정보로 키 재료를 만들어 어느 쪽도 혼자 값을 미리 정할 수 없는 키 설정 절차로 정의한다. RFC 8446 의 2절은 (EC)DHE 키 수립에서 서버가 ServerHello 로 자신의 임시(ephemeral) Diffie-Hellman 공유값을 보낸다고 한다. 부록 E.1 은 인증서 기반 모드에서 서명 키 같은 장기 키 재료가 핸드셰이크 뒤에 손상돼도, 세션 키가 지워졌다면 세션 키의 안전에는 영향이 없다고 하고, `psk_ke` 모드에서는 이 성질이 성립하지 않는다고 한다. RFC 8446 의 1.2절(TLS 1.2 와의 주요 차이)은 정적 RSA 와 DH 스위트가 제거되어 모든 공개키 기반 키 교환이 전방 비밀성을 제공한다고 한다.
(보충) 비밀값 하나로 공개값을 만들고 상대 공개값과 합쳐 같은 값에 이른다는 서술은 Diffie-Hellman 의 일반적 설명이며, 위 문서는 수학적 원리를 설명하지 않고 사용 방식만 다룬다. 임시 키를 연결마다 새로 만든다는 풀이도 (EC)DHE 의 E 가 ephemeral 이라는 일반적 설명이다.
(실험 확인) JDK 25 `KeyAgreement` 로 `X25519` 와 `ECDH`(`secp256r1`) 양쪽이 서로의 공개키만으로 같은 32바이트 비밀을 얻는 것을 다시 실행해 확인했다.
