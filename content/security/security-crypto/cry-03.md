---
slug: "cry-03"
topic: "security-crypto"
tier: BASIC
difficulty: 1
title: "대칭키 암호와 비대칭키 암호는 어떻게 다르고, 실제로는 왜 섞어 쓰나요?"
keywords: ["같은 키로 암호화·복호화", "공개키와 개인키", "RSA는 한 번에 암호화할 길이 제한", "하이브리드 암호화", "대칭키만 비대칭으로 보호"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-57pt1r5.pdf", "https://www.rfc-editor.org/rfc/rfc8017.html", "https://www.rfc-editor.org/rfc/rfc8446.html", "https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html"]
concepts: [cryptography]
importance: 3
links: [{to: "cry-09", kind: FOLLOWUP}, {to: "cry-10", kind: RELATED}]
---
**모범 답변 (30~60초)**
대칭키는 암호화와 복호화에 같은 비밀 키를 쓰는 방식이라 AES가 대표적이고, 그 키를 상대에게 안전하게 건네야 한다는 문제가 남습니다. 비대칭키는 공개키와 개인키 한 쌍을 쓰고, 공개키를 알아도 개인키는 알아낼 수 없어서 서명이나 키 설정에 쓰입니다. 다만 RSA는 한 번에 암호화할 수 있는 길이가 키 크기로 제한되어 큰 데이터에는 맞지 않습니다. 그래서 큰 데이터는 무작위 대칭키로 암호화하고 그 대칭키만 비대칭 방식으로 보호하는 하이브리드 구조를 씁니다.

```
RSA-2048 + OAEP(SHA-256): 190바이트 암호화 성공, 191바이트 -> IllegalBlockSizeException
하이브리드: AES 키를 RSA-OAEP 로 감싼 결과 256바이트 + 100,000바이트 데이터는 AES-GCM
```

(공식 문서) NIST SP 800-57 Part 1 Rev. 5 의 4.2 는 대칭키 알고리즘을 암복호화에 같은 키를 쓰는 것으로, 4.3 은 공개키와 개인키 쌍을 쓰고 공개키로 개인키를 알아낼 수 없는 것으로 설명하며, 용도로 디지털 서명과 키 합의·키 전송을 든다. RFC 8017 의 7.1.1(암호화 연산)은 RSAES-OAEP 암호화에서 메시지 길이가 `k - 2hLen - 2` 바이트 이하여야 하고 넘으면 "message too long" 오류를 낸다고 규정한다. RFC 8446 의 1절은 TLS 가 인증과 공유 키 재료 수립을 맡는 핸드셰이크 프로토콜과 그 매개변수로 트래픽을 보호하는 레코드 프로토콜로 이뤄진다고 하고, 인증은 비대칭 암호(RSA, ECDSA, EdDSA)나 사전 공유 키로 한다고 하며, 5.2절은 레코드 보호에 AEAD 대칭 암호를 쓴다고 한다.
(원저자 자료) OWASP Cryptographic Storage Cheat Sheet 의 Algorithms 절은 대칭 암호로 AES 를, 공개키 암호는 키 설정·키 유도·인증된 대칭 암호화를 묶은 하이브리드 암호화 방식을 쓰라고 권고한다.
(실험 확인) JDK 25 로 RSA-2048 OAEP-SHA-256 암호화를 시도해 190바이트까지 성공하고 191바이트에서 예외가 나는 것, 무작위 AES 키를 RSA-OAEP 로 감싸 256바이트 값을 만들고 100,000바이트 데이터를 AES-GCM 으로 암호화해 복호화까지 되는 것을 확인했다.
