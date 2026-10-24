---
slug: "cry-19"
topic: "security-crypto"
tier: TRICKY
difficulty: 3
title: "Java에서 알고리즘 이름만 주고 `Cipher.getInstance`를 부르면 어떤 모드로 암호화되나요?"
keywords: ["변환 문자열에서 모드 생략", "제공자 기본값", "SunJCE는 ECB와 PKCS5Padding", "알고리즘/모드/패딩 모두 명시", "AES/GCM/NoPadding"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://docs.oracle.com/en/java/javase/25/docs/api/java.base/javax/crypto/Cipher.html", "https://docs.oracle.com/en/java/javase/25/security/oracle-providers.html", "https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38a.pdf", "https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html"]
concepts: [cryptography]
importance: 1
links: [{to: "cry-09", kind: PREREQ}]
---
**모범 답변 (30~60초)**
알고리즘 이름만 주면 모드와 패딩은 제공자 기본값으로 정해지는데, JDK 문서는 SunJCE와 SunPKCS11이 많은 대칭 암호에서 ECB 모드와 PKCS5Padding을 기본으로 쓴다고 설명합니다. 그러니 `AES`만 쓰면 ECB로 동작해서 같은 평문 블록이 같은 암호문이 되고 IV도 없습니다. `Cipher` 문서도 알고리즘, 모드, 패딩을 모두 명시한 변환을 쓰라고 권장하므로, 보통은 `AES/GCM/NoPadding`처럼 인증 암호화 모드를 직접 지정합니다. 기본값이 제공자마다 다를 수 있다는 점도 기억해야 합니다.

```
Cipher.getInstance("AES"): getIV() = null, 평문 48바이트(같은 값 3블록) -> 암호문 64바이트
암호문 블록 0 == 블록 1 : true  (ECB 와 같은 동작)
```

(공식 문서) Java SE 25 `Cipher` 문서는 변환이 `algorithm/mode/padding` 또는 `algorithm` 형태이며 후자는 제공자별 기본 모드와 패딩을 쓴다고 하고, API 노트로 알고리즘, 모드, 패딩을 완전히 지정한 변환을 쓰기를 권하며 그렇지 않으면 기본값이 애플리케이션의 보안 요구를 충족하지 못할 수 있다고 한다. Oracle JDK Providers 문서는 모드와 패딩을 생략하면 SunJCE 와 SunPKCS11 이 많은 대칭 암호에서 ECB 모드와 PKCS5Padding 을 기본으로 쓴다고 한다. 같은 절은 ECB 를 여러 데이터 블록 암호화에 일반적으로 쓰지 말아야 하고 위험을 이해한 경우에만 쓰라고 하며, 기본값이 제공자마다 다를 수 있다고도 한다. NIST SP 800-38A 의 6.1 은 ECB 가 같은 평문 블록을 같은 암호문 블록으로 만든다고 한다.
(원저자 자료) OWASP Cryptographic Storage Cheat Sheet 는 인증된 모드(GCM, CCM)를 우선하고 ECB 는 특수한 경우 외에 쓰지 말라고 권고한다.
(실험 확인) JDK 25 에서 `Cipher.getInstance("AES")` 로 같은 값을 48바이트 암호화해 첫 두 암호문 블록이 같음을 다시 실행해 확인했고, 이 객체의 IV 는 `null` 이었다. 기본값은 이 환경의 SunJCE 결과다.
