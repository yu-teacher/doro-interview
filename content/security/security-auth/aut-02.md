---
slug: "aut-02"
topic: "security-auth"
tier: BASIC
difficulty: 1
title: "세션 기반 인증과 토큰 기반 인증은 무엇이 다르고, 어떤 기준으로 고르나요?"
keywords: ["서버가 인증 상태 저장", "세션 ID는 참조값", "토큰은 정보를 자체 포함 가능", "즉시 무효화와 확장성의 맞교환", "가진 사람이 주인인 베어러"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://docs.spring.io/spring-security/reference/servlet/authentication/session-management.html", "https://www.rfc-editor.org/rfc/rfc6749.html", "https://www.rfc-editor.org/rfc/rfc6750.html", "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html"]
concepts: [session-token-auth]
importance: 3
links: [{to: "aut-04", kind: FOLLOWUP}, {to: "aut-14", kind: FOLLOWUP}, {to: "sec-10", kind: RELATED}]
---
**모범 답변 (30~60초)**
세션 방식은 로그인에 성공하면 서버가 인증 상태를 저장해 두고 예측할 수 없는 세션 ID만 쿠키로 내려 주는 방식입니다. 요청마다 그 ID로 서버 저장소를 조회하므로 강제 로그아웃이 바로 되지만, 서버가 여러 대면 저장소를 공유해야 합니다. 토큰 방식은 서명된 JWT처럼 정보를 토큰에 담아 두어 서버가 저장소 조회 없이 서명만 검증할 수 있어 확장이 쉽지만, 이미 발급한 토큰을 만료 전에 무효로 만들기 어렵습니다. 다만 둘 다 가진 사람이 곧 주인으로 취급되므로 탈취 방어는 똑같이 필요합니다.

(공식 문서) Spring Security 세션 관리 문서는 보안 컨텍스트를 기본으로 HTTP 세션에 저장한다고 하고, 수평 확장을 위해 캐시나 DB에 저장하도록 `SecurityContextRepository`를 바꿀 수 있다고 한다. 세션을 만들고 싶지 않으면 `SessionCreationPolicy.STATELESS`를 쓰며, HTTP Basic 같은 무상태 방식은 요청마다 다시 인증한다고 설명한다.
(공식 문서) RFC 6749 1.4는 액세스 토큰이 인가 정보를 찾기 위한 식별자일 수도, 데이터와 서명으로 정보를 스스로 담을 수도 있다고 한다. 그러므로 토큰 방식이 곧 무상태라는 말은 단순화다. RFC 6750 1.2는 베어러 토큰을 그것을 가진 어떤 당사자든 암호 키 소유를 증명하지 않고 쓸 수 있는 토큰으로 정의하고, 요약(Abstract)은 오용을 막으려면 저장과 전송 중 노출로부터 보호해야 한다고 한다.
(원저자 자료) OWASP Session Management Cheat Sheet는 세션 ID 교환에 쿠키를 쓰라고 하고, 세션 ID를 CSPRNG로 만들어 최소 64비트 엔트로피를 가지게 하라고 한다. 또 인증이 끝난 세션 ID가 사용된 가장 강한 인증 수단과 일시적으로 같은 힘을 갖는다고 설명하고, 쿠키를 지우는 것만으로는 훔친 세션 ID가 무효화되지 않으므로 서버에서 세션을 만료·무효화하라고 한다.
(보충) 세션 방식은 요청마다 서버 저장소를 조회하므로 강제 로그아웃이 바로 된다는 설명은 서버가 상태를 쥐는 구조에서 이끌어낸 것이며, 고르는 기준도 일반론이다. 브라우저 중심의 서버 렌더링 웹처럼 한 서비스가 사용자 상태를 쥐고 즉시 차단이 중요하면 세션이 단순하고, 여러 서비스·모바일 클라이언트에 걸친 API라면 토큰이 맞는 경우가 많다. 정답이 정해진 문제는 아니며 폐기 요구와 운영 부담을 비교해서 정한다.
