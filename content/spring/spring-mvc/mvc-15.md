---
slug: "mvc-15"
topic: "spring-mvc"
tier: DEEP
difficulty: 2
title: "Open-in-view(OSIV)란 무엇이고 왜 끄는 경우가 많나요?"
keywords: ["OSIV", "OpenEntityManagerInViewInterceptor", "spring.jpa.open-in-view", "지연 로딩", "커넥션 점유"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-boot/reference/data/sql.html", "https://docs.spring.io/spring-boot/appendix/application-properties/index.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/orm/jpa/support/OpenEntityManagerInViewInterceptor.html"]
---
**모범 답변 (30~60초)**
OSIV는 JPA `EntityManager`를 스레드에 바인딩해 요청 처리 전체 동안 유지함으로써, 트랜잭션이 이미 끝난 뒤의 웹 뷰 단계에서도 지연 로딩이 가능하게 하는 패턴입니다. Spring Boot는 웹 애플리케이션에서 기본적으로 `OpenEntityManagerInViewInterceptor`를 등록하며, `spring.jpa.open-in-view` 기본값은 true이고 `false`로 끌 수 있습니다. 켜 두면 컨트롤러나 뷰에서 지연 로딩이 편하지만, 지연 로딩이 서비스 계층 밖에서 숨어서 일어나 성능 문제를 놓치기 쉽고, 요청 내내 열려 있는 영속성 컨텍스트가 DB 커넥션을 오래 점유해 트래픽이 많을 때 커넥션 풀이 고갈될 위험이 있습니다. 그래서 서비스 계층에서 필요한 데이터를 DTO로 확정해 반환하고 이 설정을 끄는 경우가 많습니다.

- (공식 문서, Boot) 웹 애플리케이션을 실행하면 Boot는 기본적으로 지연 로딩을 허용하기 위해 "Open EntityManager in View" 패턴을 적용하는 `OpenEntityManagerInViewInterceptor`를 등록하며, 원치 않으면 `spring.jpa.open-in-view`를 `false`로 설정한다. 프로퍼티 설명은 이 인터셉터가 요청 처리 전체 동안 JPA `EntityManager`를 스레드에 바인딩한다고 하고 기본값은 true다.
- (공식 문서, Javadoc) `OpenEntityManagerInViewInterceptor`는 요청 처리 전체 동안 `EntityManager`를 현재 스레드에 바인딩하며, 원래의 트랜잭션이 이미 끝났더라도 웹 뷰에서 지연 로딩을 허용하려는 패턴을 위한 것이라고 설명한다.
- (보충) 커넥션 점유와 풀 고갈 위험, 지연 로딩이 계층 경계를 넘어 숨는다는 점, DTO로 확정하고 끄는 관행은 일반 지식이며 읽은 문서에는 경고 문구가 없었다.
