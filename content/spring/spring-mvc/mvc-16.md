---
slug: "mvc-16"
topic: "spring-mvc"
tier: DEEP
difficulty: 2
title: "Spring MVC와 WebFlux의 차이, 그리고 선택 기준은?"
keywords: ["블로킹 vs 논블로킹", "Reactive Streams", "back pressure", "JPA/JDBC", "학습 곡선"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
"MVC는 Servlet API 기반의 동기·블로킹, 요청당 스레드 모델이고, WebFlux는 Reactive Streams 기반 논블로킹 스택으로 적은 수의 스레드로 높은 동시성을 처리하고 back pressure를 지원합니다. 공식 문서는 JPA나 JDBC 같은 블로킹 영속성을 쓰거나 기존 MVC 앱이 잘 돌아가면 MVC가 좋은 선택이고, 논블로킹 스택이나 함수형 엔드포인트가 필요할 때 WebFlux를 고려하라고 합니다. 또 리액티브가 자동으로 더 빠르게 해주는 것은 아니고, 지연이 크고 I/O가 많은 부하에서 적은 스레드와 메모리로 예측 가능하게 확장된다는 점이 이점이라고 합니다. 블로킹과 논블로킹을 섞으면 문제가 생기므로 WebFlux에서 Servlet 필터를 쓰는 것은 권장되지 않습니다."

- (공식 문서) 위 내용 모두 WebFlux "new-framework" 페이지 기준입니다. 해당 페이지에는 가상 스레드 언급이 없었습니다.
