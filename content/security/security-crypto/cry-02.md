---
slug: "cry-02"
topic: "security-crypto"
tier: BASIC
difficulty: 1
title: "해시, 암호화, 인코딩은 어떻게 다른가요?"
keywords: ["해시는 단방향", "암호화는 키로 복호화", "인코딩은 키 없이 복원", "Base64는 보호 수단이 아님", "비밀번호는 해시로 저장"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf", "https://www.rfc-editor.org/rfc/rfc4648.html", "https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html"]
concepts: [hash-function, cryptography]
importance: 3
links: [{to: "cry-04", kind: FOLLOWUP}, {to: "aut-03", kind: RELATED}]
---
**모범 답변 (30~60초)**
해시는 단방향이라 출력에서 원문을 되돌릴 수 없고, 무결성 확인이나 비밀번호 검증에 씁니다. 암호화는 키가 있으면 복호화로 원문을 되찾을 수 있고 목적은 기밀성입니다. 인코딩은 Base64처럼 데이터 표현 형식만 바꾸는 것이라 키 없이 누구나 되돌릴 수 있어서 보호 수단이 아닙니다. 그래서 비밀번호는 암호화하지 않고 해시로 저장하고, 화면에 다시 보여 줘야 하는 주소 같은 데이터만 암호화합니다. 흔한 오해가 Base64로 바꾼 값을 암호화했다고 여기는 것입니다.

```
base64 -> cGFzc3dvcmQxIQ==   decode -> password1!   (키 없이 복원)
sha256 -> 되돌릴 수 있는 디코드 연산이 없음
```

(공식 문서) RFC 4648 의 12절(보안 고려사항)은 베이스 인코딩이 눈에 띄는 정보를 시각적으로 가릴 뿐 계산상의 기밀성은 제공하지 않으며, 이를 모르고 비밀번호가 노출된 사고가 있었다고 적는다. FIPS 180-4 는 SHA 계열을 단방향 해시 함수로 규정한다.
(원저자 자료) OWASP Password Storage Cheat Sheet 의 Hashing vs Encryption 절은 해시가 단방향이어서 비밀번호 검증에 가장 적합하다고 하고, 암호화는 사용자 주소처럼 원문을 다시 보여 줘야 하는 데이터에 쓸 수 있으며, 원문 비밀번호가 꼭 필요한 예외 상황이 아니면 비밀번호는 암호화하지 말라고 권고한다.
(실험 확인) JDK 25 `Base64` 로 `password1!` 을 인코딩한 뒤 키 없이 같은 문자열로 디코딩되는 것을 다시 실행해 확인했다. `MessageDigest` 에는 다이제스트에서 입력을 되돌리는 메서드가 없다(`MessageDigest` 문서의 메서드 목록 기준).
