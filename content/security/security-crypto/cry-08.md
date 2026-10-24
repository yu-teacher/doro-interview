---
slug: "cry-08"
topic: "security-crypto"
tier: DEEP
difficulty: 2
title: "SHA-2와 SHA-3는 어떻게 다르고, MD5와 SHA-1은 왜 쓰면 안 되나요?"
keywords: ["SHA-2는 FIPS 180-4", "SHA-3는 Keccak 스펀지 구조", "서로 다른 설계로 위험 분산", "MD5 충돌 공격", "SHA-1 서명 용도 80비트 미만"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf", "https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.202.pdf", "https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-57pt1r5.pdf", "https://www.rfc-editor.org/rfc/rfc2104.html", "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/security/MessageDigest.html", "https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html"]
concepts: [hash-function]
importance: 2
links: [{to: "cry-01", kind: PREREQ}, {to: "cry-16", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
SHA-2는 FIPS 180-4에 정의된 SHA-224, SHA-256, SHA-384, SHA-512 계열이고, SHA-3는 FIPS 202에 정의된 Keccak 기반의 스펀지 구조 함수입니다. FIPS 202는 SHA-3를 SHA-2를 보완하는 표준이라고 하고, 두 계열이 근본적으로 다른 설계 원리에 기반해서 함께 있으면 앞으로의 해시 분석 발전에 대한 회복력을 준다고 설명합니다. MD5는 충돌 탐색 공격에 취약하다는 보고가 1990년대에 이미 있었고 FIPS 180-4의 해시 목록에도 없습니다. SHA-1은 충돌 저항이 필요한 서명 용도에서 보안 강도가 80비트 미만임이 확인되었다고 NIST SP 800-57이 적고 있어 서명에 쓰면 안 됩니다.

```
MD5 128비트 / SHA-1 160비트 / SHA-256 256비트 / SHA-512 512비트 / SHA3-256 256비트  (JDK 25 다이제스트 길이)
```

(공식 문서) FIPS 202 의 공고문(Announcing the Standard) 3항은 SHA-3 함수들이 FIPS 180-4 의 SHA-1 과 SHA-2 를 보완하며 근본적으로 다른 설계 원리에 기반해 앞으로의 해시 분석 발전에 대한 회복력을 준다고 하고, 1절은 SHA-3 계열이 KECCAK 에 기반한 스펀지 구조를 공유한다고 한다. FIPS 180-4 의 1절은 SHA-1, SHA-224, SHA-256, SHA-384, SHA-512, SHA-512/224, SHA-512/256 을 규정하며 MD5 는 이 문서에 없다. NIST SP 800-57 Part 1 Rev. 5 의 4.1 은 승인된 해시 함수가 FIPS 180, FIPS 202, SP 800-185 에 정의된다고 하고, 5.6.1.2 는 표 3 각주에서 SHA-1 이 디지털 서명처럼 충돌 저항이 필요한 용도에서 80비트 미만의 보안만 제공함이 입증되었다고 하며, 80비트 이하 강도는 연방 정부 정보의 서명 생성 같은 암호 보호에 더는 승인되지 않는다고 적는다. RFC 2104 의 1절은 문서 작성 시점(1997년)에 MD5 가 충돌 탐색 공격에 취약함이 최근 보였다고 적는데, 같은 문장은 그 약점이 HMAC 안에서의 MD5 사용을 위협하지는 않는다고도 한다.
(원저자 자료) OWASP Password Storage Cheat Sheet 는 MD5 와 SHA-1 이 빠르게 설계된 알고리즘이어서 느려야 하는 비밀번호 해시와 대비된다고 말한다.
(실험 확인) JDK 25 `MessageDigest` 로 다섯 알고리즘의 다이제스트 길이를 다시 실행해 확인했다. 알고리즘 강약은 실행으로 확인한 것이 아니라 위 문서의 서술이다.
