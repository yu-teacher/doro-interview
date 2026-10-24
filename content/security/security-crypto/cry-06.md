---
slug: "cry-06"
topic: "security-crypto"
tier: BASIC
difficulty: 1
title: "보안용 난수에 java.util.Random 대신 SecureRandom을 써야 하는 이유는 무엇인가요?"
keywords: ["선형 합동식 의사 난수", "같은 시드면 같은 수열", "SecureRandom은 암호학적으로 강한 난수", "토큰·키·IV 생성"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/Random.html", "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/security/SecureRandom.html", "https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html"]
concepts: [cryptography]
importance: 2
links: [{to: "cry-17", kind: RELATED}]
---
**모범 답변 (30~60초)**
`java.util.Random`은 48비트 시드에 선형 합동식을 쓰는 의사 난수 생성기라서, 같은 시드로 만들면 같은 호출 순서에서 항상 같은 수열이 나오고 문서도 암호학적으로 안전하지 않다고 명시합니다. 그래서 세션 토큰, 재설정 토큰, 암호 키, IV처럼 공격자가 예측하면 안 되는 값에는 쓰면 안 됩니다. `SecureRandom`은 FIPS 140-2의 통계 테스트를 만족하고 비결정적 출력을 내야 하는 암호학적으로 강한 난수 생성기라서 이런 값에는 이쪽을 씁니다.

```
Random(42) 두 인스턴스의 첫 nextInt: -1170105035, -1170105035   (같은 시드 -> 같은 값)
SecureRandom: 알고리즘 NativePRNG, 제공자 SUN (이 JDK 25, macOS)
```

(공식 문서) Java SE 25 `Random` 문서는 주기가 2의 48제곱뿐이고 선형 합동식을 쓰며, 같은 시드로 만든 두 인스턴스는 같은 호출 순서에서 같은 수열을 반환하고, 암호학적으로 안전하지 않으니 보안에 민감한 용도에는 `SecureRandom` 을 쓰라고 한다. `SecureRandom` 문서는 이 클래스가 암호학적으로 강한 난수 생성기이고, FIPS 140-2 4.9.1 의 통계 테스트를 최소한 만족해야 하며 비결정적 출력을 내야 하고 시드 재료도 예측 불가능해야 한다고 한다.
(원저자 자료) OWASP Cryptographic Storage Cheat Sheet 의 난수 절은 암호 키, IV, 세션 ID, CSRF 토큰, 재설정 토큰 같은 값에 CSPRNG 를 쓰라고 하고, Java 에서는 `java.util.Random` 과 `Math.random()` 을 피하고 `java.security.SecureRandom` 을 쓰라고 권고한다.
(실험 확인) JDK 25 에서 `new Random(42)` 두 개가 같은 첫 값을 내는 것, `new SecureRandom()` 이 이 환경에서 `NativePRNG`(SUN) 인 것을 다시 실행해 확인했다. 제공자는 플랫폼마다 다를 수 있다.
