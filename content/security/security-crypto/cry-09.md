---
slug: "cry-09"
topic: "security-crypto"
tier: DEEP
difficulty: 2
title: "AES를 ECB 모드로 쓰면 왜 안 되고, GCM은 무엇이 다른가요?"
keywords: ["ECB는 같은 평문 블록이 같은 암호문", "패턴 노출", "GCM은 인증 암호화", "태그로 변조 검출", "IV는 매번 새로"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38a.pdf", "https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf", "https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html", "https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.197-upd1.pdf"]
concepts: [cryptography]
importance: 2
links: [{to: "cry-17", kind: FOLLOWUP}, {to: "cry-19", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
ECB는 평문 블록을 같은 키로 각각 독립적으로 암호화하므로, 같은 평문 블록이 항상 같은 암호문 블록이 되어 데이터의 반복 패턴이 그대로 드러납니다. NIST도 이 성질이 문제라면 ECB를 쓰지 말라고 합니다. GCM은 기밀성에 더해 암호문과 추가 인증 데이터의 진위까지 보장하는 인증 암호화 모드라서, 암호문이 변조되면 복호화 때 태그 검증이 실패합니다. 대신 GCM은 같은 키에서 IV가 매번 달라야 합니다. CBC는 변조를 스스로 탐지하지 못해서 별도 인증을 붙여야 합니다.

```
ECB  : 같은 평문 블록 3개 -> 암호문 블록 0 == 블록 1 (true)
GCM  : 같은 입력 -> 블록 0 == 블록 1 (false), 길이 48 + 태그 16 = 64
GCM  : 암호문 1비트 변경 -> AEADBadTagException: Tag mismatch
CBC  : 암호문 1비트 변경 -> 복호화가 예외 없이 48바이트 반환
```

(공식 문서) NIST SP 800-38A 의 6.1 은 ECB 에서 주어진 키로는 같은 평문 블록이 항상 같은 암호문 블록으로 암호화되고, 이 성질이 바람직하지 않은 응용에서는 ECB 를 쓰지 말아야 한다고 한다. NIST SP 800-38D 의 3절은 GCM 이 블록 크기 128비트인 승인된 블록 암호(예 AES)의 모드로서 기밀성과 데이터 진위에 대한 보증을 제공하는 인증 암호화라고 하고, 4절의 용어 정의는 AAD 를 인증하되 암호화하지 않는 입력 데이터라고 하며, 8절에서 IV 의 유일성 요구를 정한다. FIPS 197 은 AES 가 128비트 블록에 128·192·256비트 키를 쓴다고 규정한다.
(원저자 자료) OWASP Cryptographic Storage Cheat Sheet 는 가능하면 인증된 모드, 우선적으로 GCM 이나 CCM 을 쓰라고 권고하고, CBC 나 CTR 은 진위를 보장하지 않으니 Encrypt-then-MAC 같은 별도 인증이 필요하며, ECB 는 아주 특수한 경우 외에는 쓰지 말라고 한다.
(실험 확인) JDK 25 로 위 네 항목을 다시 실행해 확인했다. CBC 항목은 PKCS5 패딩에서 첫 암호문 블록 근처 한 비트를 바꾼 한 경우의 관찰이며, 모든 변조가 무사히 통과한다는 뜻은 아니다.
