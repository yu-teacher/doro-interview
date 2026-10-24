---
slug: "cry-17"
topic: "security-crypto"
tier: TRICKY
difficulty: 3
title: "AES-GCM에서 같은 키로 IV(nonce)를 재사용하면 왜 치명적인가요?"
keywords: ["키와 IV 쌍은 유일해야 함", "IV 재사용 시 인증 부분키 노출 가능", "태그 위조", "96비트 IV 권장", "무작위 IV는 호출 횟수 제한"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf"]
concepts: [cryptography]
importance: 1
links: [{to: "cry-09", kind: PREREQ}]
---
**모범 답변 (30~60초)**
GCM은 같은 키로 호출할 때마다 IV가 유일해야 하고, NIST는 이 요구가 실무에서 거의 키의 비밀성만큼 중요하다고 표현합니다. IV가 한 번이라도 반복되면 공격자가 암호문들로부터 인증에 쓰는 해시 부분키를 알아낼 가능성이 높고, 그러면 임의의 암호문에 유효한 태그를 만들어 위조할 수 있습니다. 그래서 IV는 96비트를 권장하고 암호화마다 새로 만들며, 무작위로 만들 때는 같은 키로 호출할 수 있는 총 횟수가 2의 32제곱을 넘지 않게 지켜야 합니다.

```
같은 Cipher 객체로 같은 키+IV 재암호화 -> IllegalStateException: Must use either different key or iv for GCM encryption
같은 Cipher 객체 재초기화(같은 키+IV)   -> InvalidAlgorithmParameterException: Cannot reuse iv for GCM encryption
새 Cipher 객체에 같은 키+IV             -> 예외 없이 암호화됨
```

(공식 문서) NIST SP 800-38D 의 8절은 같은 IV 와 같은 키로 서로 다른 입력에 암호화 함수가 호출될 확률을 2의 -32제곱 이하로 하라는 유일성 요구를 정하고, 이 요구가 실무에서 거의 키의 비밀성만큼 중요하다고 한다. 부록 A 는 IV 가 반복되면 공격자가 해시 부분키를 알아낼 가능성이 높고, 그러면 암호문과 AAD 를 바꿔 유효한 태그를 만드는 위조를 쉽게 할 수 있다고 설명한다. 5.2.1.1 은 상호 운용성과 단순함을 위해 IV 길이를 96비트로 제한하기를 권고하고, 8.3 은 같은 키에 대해 모든 IV 길이를 합친 인증 암호화 호출 총수가 2의 32제곱을 넘으면 안 된다고 한다(무작위 방식).
(실험 확인) JDK 25 에서 위 세 경우를 다시 실행해 확인했다. 이 JDK 의 방어는 같은 `Cipher` 객체 안에서만 작동하며 다른 객체나 다른 프로세스의 IV 재사용은 막지 못한다.
