---
slug: "sec-08"
topic: "spring-security"
tier: DEEP
difficulty: 2
title: "ProviderManager는 어떻게 동작하고, 인증 후 credentials가 지워지는 것이 왜 문제가 될 수 있나요?"
keywords: ["ProviderManager", "AuthenticationProvider", "ProviderNotFoundException", "parent", "eraseCredentialsAfterAuthentication"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-security/reference/servlet/authentication/architecture.html"]
---
**모범 답변 (30~60초)**
ProviderManager는 가장 흔한 AuthenticationManager 구현으로 AuthenticationProvider 목록에 인증을 위임합니다. 각 provider는 성공이나 실패를 돌려주거나, 판단을 보류해 다음 provider에게 넘길 수 있습니다. 아무도 처리하지 못하면 ProviderNotFoundException이 발생합니다. 선택적으로 parent AuthenticationManager를 두어 처리하지 못했을 때 참고하게 할 수 있고, 여러 SecurityFilterChain이 하나의 parent를 공유하는 구성이 흔합니다. 기본적으로 인증 결과에서 민감한 credentials를 지우는데, 상태 없는 앱에서 UserDetails를 캐싱하면 문제가 될 수 있어 복사해서 캐시하거나 eraseCredentialsAfterAuthentication을 끄라고 문서가 안내합니다.

(공식 문서) 서블릿 인증 아키텍처 페이지에 근거한다. 문서는 credentials를 지우는 이유를 HttpSession에 남지 않게 하려는 것으로 설명한다.
