---
slug: "sec-11"
topic: "spring-security"
tier: DEEP
difficulty: 2
title: "CORS 설정은 왜 스프링 시큐리티보다 먼저 처리되어야 하나요?"
keywords: ["CorsFilter", "preflight", "JSESSIONID", "CorsConfigurationSource", "UrlBasedCorsConfigurationSource"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-security/reference/servlet/integrations/cors.html"]
---
**모범 답변 (30~60초)**
preflight 요청, 즉 OPTIONS 요청에는 JSESSIONID 같은 쿠키가 실리지 않기 때문입니다. 시큐리티가 먼저 처리하면 인증된 사용자가 없다고 보고 preflight를 거부해 버립니다. 그래서 CorsFilter를 써서 CORS가 시큐리티보다 먼저 처리되게 하고, 설정은 CorsConfigurationSource로 제공합니다. http.cors(withDefaults())를 켜면 UrlBasedCorsConfigurationSource 빈이 있을 때 그것을 쓰고, 없고 Spring MVC가 클래스패스에 있으면 MVC의 CORS 설정을 씁니다. cors를 disable해도 브라우저의 CORS 보호가 사라지는 게 아니라 시큐리티의 CORS 지원만 빠져 교차 출처 호출이 막힐 뿐이라고 문서가 경고합니다.

(공식 문서) CORS 페이지에 근거한다. 7.1 새 기능 목록에 PreFlightRequestFilter 지원이 추가되었다고 나온다(What's New 7.1). configurationSource와 preFlightRequestHandler를 같은 설정에 함께 쓰면 시작 시 오류가 난다.
