---
slug: "cry-10"
topic: "security-crypto"
tier: DEEP
difficulty: 2
title: "RSA와 타원곡선(ECC)은 어떻게 비교되나요? 같은 보안 강도에서 키 크기는 어떻게 다른가요?"
keywords: ["RSA는 정수 인수분해 기반", "ECC는 타원곡선 기반", "같은 강도에 더 작은 키", "128비트 강도에 RSA 3072·ECC 256", "양자 컴퓨터에는 둘 다 취약"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-57pt1r5.pdf", "https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html", "https://www.rfc-editor.org/rfc/rfc8017.html", "https://www.rfc-editor.org/rfc/rfc7518.html"]
concepts: [cryptography]
importance: 1
links: [{to: "cry-03", kind: PREREQ}]
---
**모범 답변 (30~60초)**
RSA는 정수 인수분해 계열이고 ECC는 타원곡선에 기반한 공개키 방식입니다. NIST SP 800-57의 비교표에서 128비트 보안 강도는 RSA 모듈러스 3072비트와 타원곡선 위수 크기 256에서 383비트가 대응합니다. 같은 강도에서 ECC 키가 훨씬 작아서 공개키, 서명, 인증서가 작아지는 장점이 있습니다. 다만 양자 컴퓨터가 실용화되면 두 방식의 보안 강도 추정이 크게 영향받는다고 NIST가 표의 각주에 적고, OWASP도 둘 다 양자 내성이 없다고 말합니다.

```
RSA-3072     공개키(X.509) 422바이트, 서명 384바이트
EC P-256     공개키(X.509)  91바이트, 서명 70~72바이트(DER, 값마다 약간 다름)
```

(공식 문서) NIST SP 800-57 Part 1 Rev. 5 의 5.6.1.1 표 2 는 128비트 강도에 AES-128, RSA 의 k = 3072, ECC 의 f = 256-383 을 대응시키고 192비트에 RSA 7680, ECC 384-511, 256비트에 RSA 15360, ECC 512 이상을 대응시키며, IFC(RSA)와 ECC 열의 각주로 양자 컴퓨팅이 실용화되면 강도 추정이 크게 영향받는다고 적는다. 같은 문서는 RSA 가 정수 인수분해 기반 알고리즘의 대표라고 설명한다. RFC 8017 은 RSA 암호화·서명 방식(RSAES-OAEP, RSASSA-PSS 등)을 규정한다. RFC 7518 의 3.4 는 ECC 가 RSA 와 동등한 보안을 더 짧은 키로 제공하며 ECDSA 서명이 동급 RSA 서명보다 훨씬 작다고 설명한다.
(원저자 자료) OWASP Cryptographic Storage Cheat Sheet 는 RSA 를 꼭 써야 한다면 키를 2048비트 이상으로 하라고 하고, RSA 와 Curve25519 를 포함한 ECC 가 양자 내성이 아니라고 설명한다.
(실험 확인) JDK 25 로 RSA-3072 와 EC P-256(`secp256r1`) 키 쌍과 SHA-256 서명을 만들어 인코딩된 크기를 위 블록처럼 다시 쟀다(EC 서명 길이는 실행마다 70~72바이트). 크기만 잰 것이고 속도는 비교하지 않았다.
