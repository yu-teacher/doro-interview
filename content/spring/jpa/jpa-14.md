---
slug: "jpa-14"
topic: "jpa"
tier: DEEP
difficulty: 2
title: "Open-in-view(OSIV)는 무엇이고 켜 두면 어떤 문제가 있나요?"
keywords: ["OSIV", "spring.jpa.open-in-view", "커넥션 점유", "서비스에서 DTO 변환"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-boot/reference/data/sql.html", "https://docs.spring.io/spring-boot/appendix/application-properties/index.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/orm/jpa/support/OpenEntityManagerInViewInterceptor.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/orm/jpa/support/OpenEntityManagerInViewFilter.html"]
concepts: [fetch-strategy, connection-pool]
importance: 2
links: [{to: "jpa-13", kind: PREREQ}, {to: "misc-07", kind: RELATED}]
---
**모범 답변 (30~60초)**
OSIV(Open EntityManager in View)는 JPA `EntityManager`를 웹 요청 처리 전체 동안 스레드에 묶어 두어, 원래 트랜잭션이 끝난 뒤에도 뷰나 컨트롤러에서 지연 로딩이 되게 하는 패턴입니다. Spring Boot는 웹 애플리케이션이면 기본으로 `OpenEntityManagerInViewInterceptor`를 등록하고, `spring.jpa.open-in-view`의 기본값은 true입니다. 켜 두면 `LazyInitializationException`이 줄어드는 대신, 트랜잭션 밖에서 지연 로딩 쿼리가 몰래 나가 성능 문제를 숨기고 요청 내내 DB 커넥션을 붙들 수 있다고 알려져 있습니다. 그래서 `false`로 끄고 서비스 계층 트랜잭션 안에서 필요한 데이터를 모두 가져와 DTO로 만들어 반환하는 구조를 선호합니다.

(공식 문서) Spring Boot 레퍼런스(SQL Databases 장)는 웹 애플리케이션을 실행하면 Boot가 기본으로 `OpenEntityManagerInViewInterceptor`를 등록해 웹 뷰에서 지연 로딩이 되게 하며, 원하지 않으면 `spring.jpa.open-in-view`를 `false`로 설정하라고 한다. 공통 애플리케이션 속성 문서는 이 속성이 `OpenEntityManagerInViewInterceptor`를 등록하고 요청 처리 전체 동안 JPA `EntityManager`를 스레드에 바인딩하며 기본값이 `true`라고 한다. Spring Framework API 문서는 이 인터셉터(와 서블릿 필터 `OpenEntityManagerInViewFilter`)가 원래 트랜잭션이 이미 끝났어도 웹 뷰에서 지연 로딩이 되도록 요청 전체 동안 `EntityManager`를 스레드에 바인딩하며, 서비스 계층 트랜잭션과 트랜잭션 없는 읽기 전용 실행 모두에 쓸 수 있다고 한다.
(보충) 요청 내내 DB 커넥션을 붙들어 풀이 고갈될 수 있다는 점, 트랜잭션 밖 지연 로딩 쿼리가 성능 문제를 숨긴다는 점, 끄고 서비스 계층에서 DTO로 변환하는 구조를 선호한다는 점은 위 문서들에 서술이 없어 확인하지 못한 일반적 설명이며, 실제 커넥션 점유 여부는 트랜잭션 관리와 커넥션 처리 설정에 따라 다를 수 있다. 시작 시 경고 로그가 뜬다는 이야기도 이번에 문서에서 확인하지 못해 단정하지 않는다.

```properties
# OSIV 끄기 (Spring Boot 기본값은 true)
spring.jpa.open-in-view=false
```
