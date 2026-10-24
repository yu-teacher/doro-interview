---
slug: "vul-09"
topic: "security-web-vuln"
tier: DEEP
difficulty: 2
title: "로그인한 사용자가 URL의 ID만 바꿔 남의 데이터를 볼 수 있다면 무엇이 문제이고, 어떻게 막나요?"
keywords: ["IDOR", "객체 단위 권한 검사 누락", "현재 사용자 범위 안에서 조회", "서버에서 매 요청 검사", "기본 거부"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html", "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html", "https://owasp.org/Top10/2021/A01_2021-Broken_Access_Control/index.html", "https://docs.spring.io/spring-security/reference/servlet/authorization/method-security.html"]
concepts: [access-control]
importance: 3
links: [{to: "aut-01", kind: RELATED}]
---
**모범 답변 (30~60초)**
IDOR, 즉 안전하지 않은 직접 객체 참조 문제이고, 원인은 인증이 아니라 객체 단위 권한 검사가 빠진 것입니다. 로그인했다는 사실이 그 문서가 내 것이라는 증거는 아니므로, 서버가 요청마다 이 사용자가 이 객체에 접근해도 되는지 확인해야 합니다. 구현은 기본 키로 전체에서 찾지 말고 `findByIdAndOwner`처럼 현재 사용자의 범위 안에서 조회하거나, Spring Security의 `@PostAuthorize` 같은 메서드 보안으로 결과의 소유자를 검사합니다. UUID처럼 추측하기 어려운 ID는 방어 심층일 뿐 권한 검사를 대신하지 못하고, 검사는 클라이언트가 아니라 서버에서 하며 기본값은 거부입니다.

```
id만으로 조회, alice가 2번 요청        : bob secret
소유자 범위로 조회, alice가 2번 요청   : 없음(404/403 처리)
소유자 범위로 조회, alice가 1번 요청   : alice secret
```

(원저자 자료) OWASP IDOR Prevention Cheat Sheet는 IDOR의 세 요소를 객체, 그 객체에 대한 참조(ID, UUID, 파일명 등), 객체 단위 권한 검사의 누락으로 설명한다. 복잡한 식별자는 추측을 어렵게 하지만 접근 통제는 여전히 필수이고, 완화책은 객체마다 접근 검사를 하는 것이며 추측하기 어려운 ID는 방어 심층 수단이라고 한다. 사용자가 접근 가능한 범위에서 조회하라는 예(`@current_user.projects.find`)를 들고, ID를 암호화하는 방식은 안전하게 하기 어려워 피하라고 한다. Authorization Cheat Sheet는 모든 요청마다 권한을 검증하고, 기본 거부 태도를 취하며, 클라이언트 쪽 검사에 의존하지 말라고 한다. Top 10:2021 A01 페이지는 기본 거부와 레코드 소유권을 모델 수준에서 강제하라고 한다.
(공식 문서) Spring Security 메서드 보안 문서는 `@PostAuthorize("returnObject.owner == authentication.name")` 형태의 예로 반환 객체의 소유자를 검사하는 방법을 보여 준다.
(실험 확인) JDK 25로 인메모리 맵 위에서 두 조회 방식을 비교하는 단순 시뮬레이션을 실행한 결과가 위 블록이다. Spring 환경에서 실행한 것은 아니다.
