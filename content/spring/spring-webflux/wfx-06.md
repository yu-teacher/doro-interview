---
slug: "wfx-06"
topic: "spring-webflux"
tier: TRICKY
difficulty: 2
title: "MVC 앱을 WebFlux로 바꾸면 요청 처리가 더 빨라지나요?"
keywords: ["일반적으로 더 빠르지 않음", "적은 스레드와 메모리로 확장", "지연이 있을 때 효과", "원격 호출 병렬화", "부하에서 예측 가능한 확장"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-framework/reference/web/webflux/new-framework.html"]
concepts: [nonblocking-model, reactive-programming]
importance: 2
links: [{to: "wfx-01", kind: PREREQ}, {to: "wfx-11", kind: PREREQ}, {to: "wfx-17", kind: FOLLOWUP}, {to: "wfx-21", kind: FOLLOWUP}, {to: "mvc-16", kind: RELATED}]
---
**모범 답변 (30~60초)**
일반적으로는 아니라고 답합니다. Spring 문서는 리액티브와 논블로킹이 보통 애플리케이션을 더 빠르게 만들지는 않는다고 하고, 논블로킹 방식으로 작업하려면 손이 더 가서 처리 시간이 오히려 약간 늘 수 있다고 합니다. `WebClient`로 원격 호출을 병렬 실행하는 경우처럼 빨라지는 경우는 있습니다. 문서가 꼽는 핵심 이점은 작고 고정된 수의 스레드와 적은 메모리로 확장하는 능력이고, 부하에서 더 예측 가능하게 확장해 탄력적이라는 것입니다. 다만 이 효과를 보려면 느리고 예측하기 어려운 네트워크 I/O 같은 지연이 섞여 있어야 합니다. 그래서 잘 돌아가는 MVC 앱은 바꿀 필요가 없다고 권고합니다.

(공식 문서, WebFlux 개요 Performance, Applicability) 성능에는 여러 의미가 있다고 전제하고, 리액티브와 논블로킹은 일반적으로 애플리케이션을 더 빠르게 만들지 않으며 `WebClient`로 원격 호출을 병렬 실행하는 경우처럼 빨라질 수도 있다고 한다. 논블로킹 방식은 더 많은 작업이 필요해 처리 시간이 조금 늘 수 있다. 핵심 기대 이점은 작고 고정된 스레드와 적은 메모리로 확장하는 능력이며 부하에서 더 예측 가능하게 확장해 탄력적이다. 이를 관찰하려면 느리고 예측하기 어려운 네트워크 I/O 같은 지연이 어느 정도 있어야 한다. 권고: 잘 동작하는 Spring MVC 앱은 바꿀 이유가 없고, 큰 팀이라면 논블로킹, 함수형, 선언형으로의 가파른 학습 곡선을 고려하며, 대부분의 앱에서 전환이 불필요할 것으로 기대한다고 쓴다.
문서는 Spring MVC와 WebFlux가 대립이 아니라 나란히 쓰이는 선택지라고도 설명한다. MVC와 WebFlux의 선택 기준 자체는 다른 질문(mvc-16)에서 다룬다.
Reactor와 WebFlux는 설치할 수 없어 실행해 확인하지 않았다.
