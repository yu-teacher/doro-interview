---
slug: "aut-17"
topic: "security-auth"
tier: TRICKY
difficulty: 3
title: "리프레시 토큰이 탈취되면 어떻게 막나요? 리프레시 토큰 회전(rotation)은 무엇인가요?"
keywords: ["리프레시 토큰은 장기 자격", "갱신 때마다 새 토큰 발급", "이전 토큰 재사용 시 탈취 탐지", "활성 토큰 폐기", "DPoP·mTLS로 발신자 제한"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://www.rfc-editor.org/rfc/rfc9700.html", "https://www.rfc-editor.org/rfc/rfc9449.html"]
concepts: [session-token-auth, oauth-oidc]
importance: 1
links: [{to: "aut-04", kind: PREREQ}, {to: "aut-10", kind: PREREQ}]
---
**모범 답변 (30~60초)**
리프레시 토큰은 클라이언트에 허용된 전체 범위를 나타내고 특정 리소스로 제한되지 않아서, 탈취돼 재사용되면 새 액세스 토큰을 계속 뽑아낼 수 있어 피해가 큽니다. 공개 클라이언트에 대해 RFC 9700은 두 방법 중 하나를 요구합니다. 하나는 회전으로, 갱신할 때마다 새 리프레시 토큰을 주고 이전 것은 무효로 만듭니다. 그러면 공격자와 정상 클라이언트 중 한쪽이 이미 쓴 토큰을 내밀게 되고, 서버는 누구인지는 몰라도 재사용을 탐지해 활성 토큰을 폐기합니다. 대가로 정상 클라이언트도 새 인가 승인을 받아야 합니다. 다른 하나는 DPoP나 mTLS로 토큰을 특정 클라이언트의 키에 묶는 방법입니다.

```
client refresh : ok new=4690eeaf
attacker replays old r1 : replay detected -> family revoked
legit client with newest token: replay detected -> family revoked
```

(공식 문서) RFC 9700 4.14.2는 공개 클라이언트의 리프레시 토큰 재사용을 탐지하기 위해 발신자 제한 리프레시 토큰(RFC 8705 또는 RFC 9449; 9700의 참고 문헌 목록은 RFC 8705를 상호 TLS 인증서 바인딩 사양으로 소개한다)이나 리프레시 토큰 회전 중 하나를 반드시 써야 한다(MUST)고 한다. 회전은 갱신 응답마다 새 리프레시 토큰을 발급하고 이전 토큰을 무효화하되 둘의 관계 정보는 유지하며, 침해된 토큰이 양쪽에서 쓰이면 누가 제출했는지는 알 수 없지만 활성 토큰을 폐기해 공격을 멈추고 정상 클라이언트가 새 인가 승인을 받게 만드는 비용을 치른다고 설명한다. 2.2.2는 같은 요구를 요약한다.
(공식 문서) RFC 9449 1은 DPoP가 클라이언트가 키 쌍 소유를 증명하는 JWT를 DPoP 헤더에 담아 토큰을 그 공개 키에 묶는 애플리케이션 수준 발신자 제한 방식이며, 공개 클라이언트의 리프레시 토큰에도 쓸 수 있다고 한다.
(실험 확인) Python 3.14로 내가 짠 단순 모델에서(2026-10-24 재실행, 같은 출력) 갱신이 새 토큰을 주고, 이미 쓴 이전 토큰을 다시 내면 재사용으로 판정해 같은 계열의 토큰을 모두 폐기하며, 그 뒤에는 정상 클라이언트의 최신 토큰도 거부됨을 확인했다. 위 설명을 흉내 낸 모델이며 실제 인가 서버 구현을 확인한 것은 아니다.
