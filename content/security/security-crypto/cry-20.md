---
slug: "cry-20"
topic: "security-crypto"
tier: TRICKY
difficulty: 3
title: "해시나 MAC 값을 비교할 때 equals 대신 MessageDigest.isEqual을 쓰라는 이유는 무엇인가요?"
keywords: ["타이밍 공격", "첫 불일치에서 비교 종료", "상수 시간 비교", "비교 시간이 내용에 의존하지 않음"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/security/MessageDigest.html", "https://www.rfc-editor.org/rfc/rfc7518.html", "https://www.rfc-editor.org/rfc/rfc7515.html"]
concepts: [mac-signature]
importance: 1
links: [{to: "cry-05", kind: PREREQ}]
---
**모범 답변 (30~60초)**
일반 비교는 보통 첫 번째로 다른 바이트에서 멈추기 때문에, 비교에 걸린 시간이 맞는 앞부분의 길이에 따라 달라질 수 있고 이 차이로 값을 한 바이트씩 추측하는 타이밍 공격이 가능합니다. RFC 7518은 JWS의 HMAC 값 비교를 타이밍 공격을 막도록 상수 시간으로 하라고 요구합니다. 자바에서는 `MessageDigest.isEqual`이 쓰이는데, 문서의 구현 노트는 두 번째 배열이 null이 아니고 비어 있지 않으면 계산 시간이 첫 번째 배열의 길이에만 의존하고 두 배열의 내용에는 의존하지 않는다고 설명합니다.

```
isEqual(같은 다이제스트, 같은 다이제스트) = true     isEqual(a, b) = false
isEqual(a, null) = false     isEqual(a, 길이가 다른 배열) = false
```

(공식 문서) RFC 7518 의 3.2 는 JWS 에서 계산한 HMAC 값과 받은 서명 값의 비교를 타이밍 공격을 막기 위해 상수 시간으로 해야 한다(MUST)고 규정한다. RFC 7515 의 10.9 는 성공한 연산과 실패한 연산의 소요 시간이 다르면 공격자가 그 차이로 키에 대한 정보를 얻을 수 있으므로 그런 차이를 피해야 한다고 한다. Java SE 25 `MessageDigest.isEqual` 문서는 두 다이제스트가 길이가 같고 대응하는 모든 바이트가 같을 때 같다고 하고, 구현 노트로 `digestb` 가 null 이 아니고 길이 0 도 아니면 계산 시간이 `digesta` 의 길이에만 의존하며 `digestb` 의 길이나 두 내용에는 의존하지 않는다고 한다. 이 시간 특성은 메서드 계약이 아니라 구현 노트(Implementation Note)로 적혀 있다.
(보충) 일반 비교가 첫 불일치에서 멈추고 그 시간 차이로 한 바이트씩 추측할 수 있다는 구체적 메커니즘은 위 문서들이 설명하지 않는 일반적 설명이며, `isEqual` 이 이 용도라는 점도 문서가 명시한 것이 아니라 위 구현 노트에서 이끌어 낸 것이다.
(실험 확인) JDK 25 에서 `isEqual` 의 결과값(같음, 다름, null, 길이 불일치)만 다시 실행해 확인했다. 실행 시간의 상수성은 측정이 환경 잡음에 민감해 측정하지 않았다.
