---
slug: "mvc-02"
topic: "spring-mvc"
tier: BASIC
difficulty: 1
title: "Front Controller 패턴이란 무엇이고 Spring MVC는 어떻게 적용하나요?"
keywords: ["Front Controller", "단일 진입점", "위임", "전략 교체"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
"Front Controller는 모든 요청의 단일 진입점을 두고, 공통 처리 흐름은 그곳에서 수행하며 실제 작업은 다른 컴포넌트에 위임하는 패턴입니다. Spring MVC에서는 `DispatcherServlet`이 그 역할입니다. 요청마다 인증, 인코딩, 매핑 같은 공통 알고리즘을 한곳에서 제공하고, 매핑·실행·예외 처리·뷰 해석은 교체 가능한 빈들에게 넘깁니다. 덕분에 컨트롤러는 서블릿 API를 직접 다루지 않고 비즈니스 로직에 집중할 수 있고, 전략을 바꿔 끼우기도 쉽습니다."

- (공식 문서) Spring MVC는 중앙 `Servlet`인 `DispatcherServlet`을 중심으로 설계되었고, 공유되는 요청 처리 알고리즘을 제공하면서 실제 작업은 위임 컴포넌트가 수행합니다. Servlet 스펙에 따라 선언·매핑해야 하며, Spring Boot는 이를 자동 구성합니다.
