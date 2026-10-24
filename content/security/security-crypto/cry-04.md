---
slug: "cry-04"
topic: "security-crypto"
tier: BASIC
difficulty: 1
title: "비밀번호를 DB에 저장할 때 왜 솔트를 쓰고 느린 해시를 쓰나요?"
keywords: ["사용자마다 다른 무작위 솔트", "같은 비밀번호도 다른 해시", "미리 계산한 표 공격 방어", "느린 해시와 작업 계수", "빠른 해시는 부적합"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://pages.nist.gov/800-63-4/sp800-63b.html", "https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html", "https://www.rfc-editor.org/rfc/rfc8018.html"]
concepts: [password-storage]
importance: 3
links: [{to: "cry-13", kind: FOLLOWUP}, {to: "sec-05", kind: RELATED}, {to: "sec-09", kind: RELATED}]
---
**모범 답변 (30~60초)**
비밀번호는 복호화할 필요가 없으니 해시로 저장하되, 솔트와 느린 해시를 함께 씁니다. 솔트는 사용자마다 다른 무작위 값이라 같은 비밀번호도 서로 다른 해시가 되고, 미리 계산해 둔 표를 쓰거나 한 번 계산한 값을 전체 계정에 대조하는 공격이 막힙니다. 솔트는 비밀이 아니라 해시와 같이 저장합니다. 여기에 작업 계수를 조절할 수 있는 느린 해시를 쓰면 DB가 유출돼도 추측 한 번의 비용이 커집니다. 그래서 SHA-256 같은 빠른 해시는 이 용도에 맞지 않는다고 OWASP가 권고합니다.

```
PBKDF2-HMAC-SHA256, 같은 비밀번호
  솔트 A -> 8b4f939036ec93d3...   솔트 B -> a991b1b991ddafe8...   (솔트가 다르면 다른 값)
  반복 1000회 1ms,  반복 600,000회 71ms (JDK 25, 이 PC, 실행마다 다름)
```

(공식 문서) NIST SP 800-63B-4 의 3.1.1.2 는 검증자가 비밀번호를 오프라인 공격에 견디는 형태로 저장해야 하며, 솔트를 넣고 적절한 비밀번호 해시 방식으로 해시해야 한다고 한다. 비용 계수는 성능을 해치지 않는 선에서 가능한 한 높게 하고 시간이 지나며 올리라고(SHOULD) 하며, 솔트는 32비트 이상이고 솔트와 해시를 모두 저장한다고 규정한다. RFC 8018 의 4.1 은 솔트가 있으면 상대가 후보 키 전체를 미리 계산하기 어렵고 같은 키가 두 번 선택될 가능성이 낮아진다고 설명한다.
(원저자 자료) OWASP Password Storage Cheat Sheet 는 사용자별 고유 솔트가 레인보우 테이블을 막고 같은 비밀번호인지 알아내는 것도 막는다고 설명하며, SHA-256 같은 빠른 해시는 추측을 빠르게 하게 하므로 적합하지 않고 Argon2id, bcrypt, PBKDF2 같은 느린 해시를 쓰라고 권고한다.
(실험 확인) JDK 25 `PBKDF2WithHmacSHA256` 으로 같은 비밀번호에 솔트를 달리하면 결과가 달라지고 같은 솔트에서는 같은 값이 나오는 것을 다시 실행해 확인했다. 반복 횟수에 따른 시간은 이 노트북에서 한 번 잰 값이라 환경마다 다르다.
