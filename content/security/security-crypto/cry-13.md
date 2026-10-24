---
slug: "cry-13"
topic: "security-crypto"
tier: DEEP
difficulty: 2
title: "비밀번호 해시로 bcrypt, PBKDF2, Argon2는 각각 어떤 특징이 있고 무엇을 고르나요?"
keywords: ["PBKDF2는 솔트와 반복 횟수", "bcrypt는 72바이트 입력 제한", "Argon2는 메모리 하드", "새 시스템은 Argon2id", "FIPS가 필요하면 PBKDF2"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://www.rfc-editor.org/rfc/rfc8018.html", "https://www.rfc-editor.org/rfc/rfc9106.html", "https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html", "https://pages.nist.gov/800-63-4/sp800-63b.html"]
concepts: [password-storage]
importance: 2
links: [{to: "cry-04", kind: PREREQ}, {to: "sec-09", kind: RELATED}]
---
**모범 답변 (30~60초)**
PBKDF2는 솔트와 반복 횟수로 비용을 올리는 표준 방식이고, FIPS 검증 구현이 있어서 규정이 필요할 때 쓴다고 OWASP가 설명합니다. bcrypt는 작업 계수로 비용을 정하지만 대부분의 구현에서 입력이 72바이트로 제한됩니다. Argon2는 메모리를 많이 쓰도록 설계된 메모리 하드 함수이고, RFC 9106은 Argon2id를 주 변형으로 두며 유형을 잘 모르겠으면 Argon2id를 고르라고 합니다. OWASP는 새 시스템에는 Argon2id를, 없으면 scrypt를, bcrypt는 기존 시스템용으로, FIPS가 필요하면 PBKDF2를 권고합니다.

(공식 문서) RFC 8018 의 5.2절은 PBKDF2 가 새 응용에 권장되며 비밀번호에 솔트와 반복 횟수를 적용해 키를 유도한다고 하고, 4.2 는 NIST SP 800-132 를 인용해 반복 횟수를 사용자가 감당할 시간 안에서 가능한 한 크게 하고 최소 1,000회를 권고한다고 한다. RFC 9106 은 Argon2 를 메모리 하드 함수로 소개하고(1절), Argon2id 가 주 변형이며 구현이 반드시(MUST) 지원해야 한다고 한다. 4절은 유형을 잘 모르거나 부채널 공격이 우려되면 Argon2id 를 고르라고 하고, 첫째 권장 설정으로 t=1, p=4, 2 GiB 메모리를 제시한다. NIST SP 800-63B-4 의 3.1.1.2 는 승인된 비밀번호 해시 방식(SP 800-132 또는 갱신된 지침의)을 쓰기를 권고한다(SHOULD).
(원저자 자료) OWASP Password Storage Cheat Sheet 는 Argon2id 를 최소 설정(예 m=19456 KiB, t=2, p=1)으로, 없으면 scrypt 를, bcrypt 는 작업 계수 10 이상과 72바이트 제한 조건의 레거시용으로, FIPS-140 이 필요하면 HMAC-SHA-256 PBKDF2 를 600,000회 이상으로 쓰라고 권고한다. 같은 문서는 PBKDF2 가 NIST SP 800-63B-4 에서 허용되고 FIPS-140 검증 구현이 있다고 설명하며, bcrypt 입력 한도가 대부분의 구현에서 72바이트라고 적는다.
(실험 확인) JDK 25 `PBKDF2WithHmacSHA256` 은 이 PC 에서 반복 600,000회에 약 70ms 가 걸렸다(실행마다 다름). JDK 25 등록 제공자의 `SecretKeyFactory`, `MessageDigest`, `Mac`, `Cipher` 서비스를 열거해 보니 bcrypt, scrypt, Argon2 이름이 없어 이들은 실행하지 못했다.
