---
slug: "cry-11"
topic: "security-crypto"
tier: DEEP
difficulty: 2
title: "디지털 서명과 MAC은 어떻게 다르고, JWT의 HS256과 RS256은 각각 어느 쪽인가요?"
keywords: ["MAC은 같은 비밀 키로 생성·검증", "디지털 서명은 개인키로 서명, 공개키로 검증", "HS256은 HMAC", "RS256은 RSA 서명", "검증만 하는 쪽에는 공개키"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-57pt1r5.pdf", "https://www.rfc-editor.org/rfc/rfc7518.html", "https://www.rfc-editor.org/rfc/rfc7515.html", "https://www.rfc-editor.org/rfc/rfc2104.html"]
concepts: [mac-signature, jwt]
importance: 2
links: [{to: "cry-05", kind: PREREQ}, {to: "cry-18", kind: FOLLOWUP}, {to: "aut-16", kind: RELATED}]
---
**모범 답변 (30~60초)**
MAC은 생성과 검증에 같은 비밀 키를 쓰므로 키를 가진 모두가 태그를 만들 수 있습니다. 디지털 서명은 개인키로 서명하고 공개키로 검증하기 때문에 검증하는 쪽은 서명을 만들 수 없습니다. JWT의 HS256은 SHA-256을 쓰는 HMAC이라 MAC이고, RS256은 SHA-256을 쓰는 `RSASSA-PKCS1-v1_5` 서명입니다. 그래서 토큰을 발급하는 서비스와 검증만 하는 여러 서비스로 나뉜 구조에서는 검증 쪽에 공개키만 배포할 수 있는 RS256 같은 서명이 유리하고, 발급과 검증이 한 곳이면 HS256으로도 구성할 수 있습니다.

(공식 문서) NIST SP 800-57 Part 1 Rev. 5 의 4.2 는 MAC 을 같은 키로 생성하고 검증하는 대칭키 방식으로 설명한다. 용어집은 서명 생성을 개인키로, 서명 검증을 공개키로 하는 것으로 정의하고, 4.3 은 개인키는 소유자만 통제하고 공개키는 누구나 알 수 있다고 한다. RFC 7515 의 10.5 는 서명의 개인키는 보통 한 주체만 갖지만 MAC 키는 무결성을 계산하고 검사하는 모든 주체가 가져야 하고, MAC 검증은 키를 아는 당사자 중 하나가 만들었다는 것만 보여 줄 뿐 제3자에게 작성자를 증명하는 데는 쓸 수 없다고 설명한다. RFC 7518 의 3.1 표는 HS256 을 SHA-256 을 쓰는 HMAC(구현 필수), RS256 을 SHA-256 을 쓰는 `RSASSA-PKCS1-v1_5`(권장)로 정의하고, 3.2 는 HMAC 키를 해시 출력과 같은 크기(HS256 은 256비트) 이상으로 쓰라고(MUST), 3.3 은 RS256 계열에 2048비트 이상 RSA 키를 쓰라고(MUST) 규정한다. 3.2 는 HMAC 이 MAC 키 소유를 보여 준다고도 설명한다.
(보충) 발급 서비스와 검증 서비스가 나뉜 구조에서 RS256 이 유리하고 발급과 검증이 한 곳이면 HS256 도 된다는 결론은 위 키 배포 차이에서 이끌어 낸 일반적 설계 설명이며 위 문서가 그렇게 권고하는 것은 아니다.
