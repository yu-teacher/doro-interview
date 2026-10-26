---
slug: "scl-11"
topic: "spring-cloud"
tier: DEEP
difficulty: 2
title: "Config Server에 비밀번호 같은 민감한 값은 어떻게 저장하고, 서버는 어떻게 보호하나요?"
keywords: ["{cipher} 접두어", "서버가 복호화해 응답", "/encrypt·/decrypt 엔드포인트", "대칭키·비대칭키", "애플리케이션별 접근 제어"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-cloud-config/reference/server/encryption-and-decryption.html", "https://docs.spring.io/spring-cloud-config/reference/server/key-management.html", "https://docs.spring.io/spring-cloud-config/reference/server/security.html", "https://docs.spring.io/spring-cloud-config/reference/server/actuator-and-security.html"]
concepts: [externalized-config, cryptography]
importance: 1
links: [{to: "scl-04", kind: PREREQ}, {to: "k8s-17", kind: RELATED}]
---
**모범 답변 (30~60초)**
저장소에는 `{cipher}` 접두어가 붙은 암호문을 커밋하고, Config Server가 클라이언트에 응답하기 전에 복호화합니다. 그래서 저장소에는 평문이 남지 않습니다. 서버의 `/encrypt`, `/decrypt` 엔드포인트로 값을 암호화하고 대칭키는 `encrypt.key`, 비대칭키는 키스토어로 설정하며, 복호화에 실패한 값은 응답에서 빠지고 `invalid.` 접두어가 붙은 키가 대신 들어갑니다. 서버 자체는 스프링 시큐리티로 보호하는데, 기본적으로 인증된 클라이언트는 어느 애플리케이션 설정이든 요청할 수 있어서 서비스별로 격리하려면 인가 규칙을 직접 만들어야 합니다.

(공식 문서) 암호화 문서는 `{cipher}`로 시작하는 값을 클라이언트에 HTTP로 보내기 전에 복호화하고, 덕분에 저장소에 평문이 없다고 설명한다. 복호화할 수 없는 값은 소스에서 제거되고 같은 키에 `invalid` 접두어가 붙은 속성(보통 `<n/a>`)이 추가되며, `prefix-invalid-properties=false`로 이 동작을 끄면 암호문이 그대로 나간다. `/encrypt`와 `/decrypt`는 보안이 적용되고 권한 있는 주체만 접근한다고 가정한다. `.properties` 파일의 암호문 값은 따옴표로 감싸면 복호화되지 않는다.
(공식 문서) 키 관리 문서는 대칭키(`encrypt.key` 또는 `ENCRYPT_KEY` 환경 변수)와 비대칭키(`encrypt.keyStore.*`) 두 가지를 설명하고, 비대칭이 보안상 낫지만 대칭이 설정하기 편하다고 한다. 보안 문서는 스프링 시큐리티가 클래스패스에 있으면 HTTP Basic이 기본이고 비밀번호를 설정하고 암호화하라고 권하며, 대규모에서는 OAuth2 JWT 베어러 토큰이 흔한 선택이라고 한다. 기본적으로 인증된 사용자는 어떤 `{application}`이든 요청할 수 있어서 서비스 간 비밀을 격리하려면 경로의 애플리케이션 이름과 주체를 비교하는 인가 정책을 직접 구현해야 한다고 한다. 액추에이터 의존성이 없으면 `/actuator/**` 요청이 설정 API와 매칭돼 정보가 샐 수 있다는 경고와, 운영에서는 TLS를 설정하라는 안내도 있다.
