---
slug: "sec-05"
topic: "spring-security"
tier: BASIC
difficulty: 1
title: "비밀번호는 왜 SHA-256 같은 해시가 아니라 bcrypt 같은 알고리즘으로 저장하나요?"
keywords: ["PasswordEncoder", "솔트", "작업 계수", "bcrypt", "1초"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-security/reference/features/authentication/password-storage.html", "https://docs.spring.io/spring-security/reference/servlet/authentication/passwords/password-encoder.html"]
concepts: [cryptography]
importance: 3
links: [{to: "sec-09", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
비밀번호는 되돌릴 수 없는 단방향 변환으로 저장해야 하고, 스프링 시큐리티는 PasswordEncoder로 이를 처리합니다. 문서는 평문에서 솔트 없는 해시, 솔트를 쓴 해시로 발전했지만 SHA-256 같은 해시는 최신 하드웨어가 초당 수십억 번 계산할 수 있어 더 이상 안전하지 않다고 설명합니다. 그래서 의도적으로 느린 적응형 함수를 쓰고, 하드웨어에 맞춰 작업 계수(work factor)를 조정해 검증에 약 1초가 걸리게 하라고 합니다. 권장 알고리즘은 bcrypt, PBKDF2, scrypt, argon2입니다. 비용이 큰 만큼 매 요청마다 검증하지 말고 세션이나 토큰 같은 단기 자격 증명으로 바꿔 쓰라고 안내하며, BCryptPasswordEncoder의 기본 strength는 10입니다.

(공식 문서) Password Storage 페이지에 근거한다. Argon2PasswordEncoder는 BouncyCastle이 필요하고, PBKDF2는 FIPS 인증이 필요할 때 좋은 선택이라고 한다. `NoOpPasswordEncoder`(평문)로 되돌리는 것은 안전하지 않다고 문서가 명시한다.
