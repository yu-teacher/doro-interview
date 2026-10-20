---
slug: "mvc-15"
topic: "spring-mvc"
tier: DEEP
difficulty: 2
title: "Open-in-view(OSIV)란 무엇이고 왜 끄는 경우가 많나요?"
keywords: ["OSIV", "OpenEntityManagerInViewInterceptor", "spring.jpa.open-in-view", "지연 로딩", "커넥션 점유"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
"OSIV는 요청이 시작될 때 열린 `EntityManager`(영속성 컨텍스트)를 뷰 렌더링 혹은 응답 직렬화까지 열어 두어서, 컨트롤러나 뷰에서도 지연 로딩이 가능하게 하는 패턴입니다. Spring Boot는 웹 애플리케이션에서 `OpenEntityManagerInViewInterceptor`를 기본 등록하고, `spring.jpa.open-in-view=false`로 끌 수 있습니다. 켜 두면 편하지만 DB 커넥션을 요청이 끝날 때까지 잡고 있을 수 있어 트래픽이 많을 때 커넥션 풀 고갈 위험이 있고, 지연 로딩이 계층 경계를 넘어 숨어서 일어나 성능 문제를 놓치기 쉽습니다. 그래서 서비스 계층에서 필요한 데이터를 DTO로 확정해 반환하는 방식과 함께 끄는 경우가 많고, 데모의 `application.yml`도 `open-in-view: false`입니다."

- (공식 문서) Boot는 웹 애플리케이션에서 기본적으로 `OpenEntityManagerInViewInterceptor`를 등록하며, 원치 않으면 `spring.jpa.open-in-view`를 `false`로 설정합니다.
- (보충) 커넥션 점유와 풀 고갈 위험 설명은 일반 지식이며 해당 문서에는 경고 문구가 없었습니다.
