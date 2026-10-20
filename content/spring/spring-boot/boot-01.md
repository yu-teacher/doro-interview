---
slug: "boot-01"
topic: "spring-boot"
tier: BASIC
difficulty: 1
title: "Spring과 Spring Boot의 차이는 무엇인가요?"
keywords: ["자동 설정", "starter", "내장 서버", "의존성 관리", "관례 우선(Convention over Configuration)"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
"Spring Framework는 DI, AOP, MVC, 트랜잭션 같은 핵심 기능을 제공하는 프레임워크이고, Spring Boot는 그 위에서 설정과 실행 환경을 자동화해 주는 도구입니다. 예전에는 의존성 버전을 일일이 맞추고 XML이나 Java 설정으로 DispatcherServlet, DataSource 같은 빈을 직접 등록하고 WAR를 외부 톰캣에 배포해야 했는데, Boot는 starter, 자동 설정, 내장 서버로 이걸 줄여 줍니다. 그래서 Boot는 Spring을 대체하는 게 아니라 Spring을 쉽게 쓰게 해 주는 레이어라고 설명합니다. 데모 프로젝트도 `main`에서 `SpringApplication.run`만 호출하면 내장 톰캣까지 뜹니다."

- 공식 문서: 각 Boot 릴리스는 기반이 되는 Spring Framework 버전이 정해져 있고, 큐레이션된 의존성 목록을 함께 제공한다.
- (보충) "Boot는 Spring의 기능을 새로 만들지 않는다"는 정리는 일반적인 설명이며 문서 문장 그대로는 아니다.
