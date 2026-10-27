---
slug: "cry-05"
topic: "security-crypto"
tier: BASIC
difficulty: 1
title: "HMAC은 무엇이고, 그냥 해시와 무엇이 다른가요?"
keywords: ["비밀 키를 쓰는 해시 기반 MAC", "키 없이는 태그를 만들 수 없음", "변조와 출처 확인", "키는 무작위로 충분한 길이", "태그 비교는 상수 시간"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://www.rfc-editor.org/rfc/rfc2104.html", "https://www.rfc-editor.org/rfc/rfc7518.html", "https://www.rfc-editor.org/rfc/rfc7515.html", "https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-57pt1r5.pdf", "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/security/MessageDigest.html"]
concepts: [mac-signature]
importance: 3
links: [{to: "cry-11", kind: FOLLOWUP}, {to: "cry-20", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
HMAC은 비밀 키와 해시 함수를 조합해 만드는 메시지 인증 코드입니다. 그냥 해시는 누구나 계산할 수 있어서 메시지를 바꾸고 해시도 새로 계산해 붙이면 들키지 않지만, HMAC 태그는 키를 가진 쪽만 만들 수 있어서 메시지가 변조되지 않았고 키를 아는 상대가 만들었다는 것을 확인할 수 있습니다. 키는 무작위로 만들고 해시 출력 길이 이상으로 두는 것이 좋습니다. 태그를 비교할 때는 시간이 내용에 의존하지 않는 상수 시간 비교를 써야 합니다. 양쪽이 같은 키를 공유하니 제3자 앞에서 누가 만들었는지 증명하는 서명 용도는 아닙니다.

```
HmacSHA256 태그 32바이트
메시지 변경 -> 태그 불일치 / 다른 키 -> 태그 불일치 (MessageDigest.isEqual 로 비교)
```

(공식 문서) RFC 2104 는 HMAC 을 임의의 반복형 암호 해시 함수와 비밀 공유 키로 메시지 인증 값을 계산하는 방식으로 정의하고, 1절에서 비밀 키 기반 무결성 검사를 메시지 인증 코드라 부르며 보통 비밀 키를 공유한 두 당사자 사이에서 쓴다고 한다. 3절은 키를 무작위로(또는 무작위 시드의 암호학적으로 강한 의사 난수로) 정하고, 해시 출력 길이 L 바이트보다 짧은 키는 강도를 낮추므로 강하게 말린다고 한다. NIST SP 800-57 의 4.1 은 암호 해시 함수가 기본 동작에 키를 요구하지 않는다고 하고, 4.2 는 MAC 이 같은 키로 생성하고 검증한다고 적는다. RFC 7518 의 3.2 는 HMAC 이 MAC 을 만든 쪽이 MAC 키를 가졌음을 보여 준다고 설명하고, JWS 의 HMAC 검증에서 계산한 값과 서명 값의 비교를 타이밍 공격을 막도록 상수 시간으로 해야 한다(MUST)고 규정한다. RFC 7515 의 10.5 는 MAC 검증이 키를 아는 당사자 중 하나가 만들었다는 것만 확인해 주며 제3자에게 작성자를 증명하는 데는 쓸 수 없다고 설명한다. Java SE 25 `MessageDigest.isEqual` 문서는 구현 노트로 비교 시간이 두 내용에 의존하지 않는다고 적는데, 계약이 아니라 구현 노트이다.
(실험 확인) JDK 25 `Mac` `HmacSHA256` 으로 32바이트 태그를 만들고, 메시지를 바꾸거나 키를 바꾸면 태그가 달라지는 것을 `MessageDigest.isEqual` 로 다시 실행해 확인했다.
