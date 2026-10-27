---
slug: "cry-01"
topic: "security-crypto"
tier: BASIC
difficulty: 1
title: "암호학적 해시 함수는 어떤 성질을 가져야 하나요?"
keywords: ["고정 길이 출력", "역상 저항", "충돌 저항", "입력이 조금만 바뀌어도 다른 값"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-57pt1r5.pdf", "https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf", "https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.202.pdf"]
concepts: [hash-function]
importance: 3
links: [{to: "cry-02", kind: FOLLOWUP}, {to: "cry-08", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
해시 함수는 길이가 제각각인 입력을 고정 길이 값으로 바꾸는 함수이고, 암호학적 해시는 특히 두 가지를 보장하도록 설계됩니다. 하나는 역상 저항으로, 어떤 출력이 주어졌을 때 그 출력을 만드는 입력을 찾는 일이 현실적으로 불가능해야 합니다. 다른 하나는 충돌 저항으로, 같은 해시값을 내는 서로 다른 입력 두 개를 찾는 일이 불가능해야 합니다. 입력이 조금만 달라져도 결과가 크게 달라지기 때문에 무결성 확인이나 서명 대상의 요약값으로 씁니다. 해시값만 안전하게 보관해 두면 나중에 원본이 바뀌었는지 비교로 알 수 있습니다.

```
SHA-256("hello") = 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
SHA-256("hellp") = fdd7585e08c4e2afd71dcabdb4636c89d557a3f42db9e2040c8bbd1708aa4ce7
SHA-256(1MB 입력)  -> 32바이트
```

(공식 문서) NIST SP 800-57 Part 1 Rev. 5 의 5.6.1.2 는 해시 함수가 임의(상한은 있는) 길이의 비트열을 고정 길이 비트열로 대응시킨다고 정의하고, 승인된 해시 함수가 만족하는 성질로 역상 저항(지정된 출력에 대응하는 입력을 찾는 것이 계산상 불가능)과 충돌 저항(같은 출력을 내는 서로 다른 입력 둘을 찾는 것이 계산상 불가능)을 든다. FIPS 180-4 의 1절은 이 알고리즘들이 반복 구조의 단방향 해시 함수이며, 메시지가 바뀌면 매우 높은 확률로 다른 다이제스트가 나온다고 설명한다. FIPS 202 의 공고문(Announcing the Standard) 3항은 서명 대상을 메시지 대신 다이제스트로 하면 충돌 저항 덕분에 같은 서명으로 다른 메시지를 내밀 수 없다는 취지로 설명한다.
(실험 확인) JDK 25 `MessageDigest` 로 SHA-256 을 계산한 결과가 위 블록이다. 한 글자(`o` 와 `p`)만 달라도 출력이 전혀 다르고, 입력 길이와 무관하게 32바이트다. 몇 개 입력의 관찰이라 성질의 증명은 아니다.
