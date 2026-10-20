---
slug: "misc-04"
topic: "spring-misc"
tier: BASIC
difficulty: 1
title: "Spring Framework, Spring Boot, Spring MVC, Spring Data의 관계는?"
keywords: ["Framework = 코어", "MVC = 웹 모듈", "Data = 별도 프로젝트", "Boot = 자동 설정·스타터·내장 서버"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/overview.html", "https://docs.spring.io/spring-data/commons/reference/index.html", "https://docs.spring.io/spring-data/commons/reference/repositories/core-concepts.html", "https://docs.spring.io/spring-security/reference/index.html", "https://docs.spring.io/spring-boot/index.html", "https://docs.spring.io/spring-boot/reference/using/build-systems.html", "https://docs.spring.io/spring-boot/reference/using/auto-configuration.html", "https://docs.spring.io/spring-boot/reference/web/servlet.html", "https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Release-Notes"]
concepts: [auto-configuration, mvc-request-flow]
importance: 2
links: [{to: "boot-01", kind: RELATED}]
---
**모범 답변 (30~60초)**
Spring Framework는 IoC 컨테이너와 DI, AOP, 트랜잭션, 테스트 같은 핵심 기반이고, Spring MVC는 그 안에 들어 있는 서블릿 기반 웹 모듈입니다. 리액티브 웹은 Framework 안의 WebFlux가 따로 맡습니다. Spring Data와 Spring Security는 Framework 위에 만들어진 별도 프로젝트로, 저장소와 릴리스 주기도 따로입니다. Spring Boot도 별도 프로젝트이고, 새 기술이 아니라 Framework를 쉽게 조립해서 바로 실행하게 해 주는 도구입니다. 검증된 의존성 목록과 스타터, 클래스패스를 보고 구성하는 자동 설정, 내장 서버가 핵심이고, Boot 4는 Framework 7 기반입니다.

(공식 문서) Framework 개요 문서는 Framework가 모듈로 나뉘며, 핵심은 설정 모델과 DI를 포함한 코어 컨테이너이고 그 위에 메시징, 트랜잭션·영속성, 웹을 위한 기반 지원이 있다고 한다. 서블릿 기반 Spring MVC와, 그와 나란히 존재하는 리액티브 Spring WebFlux도 Framework에 포함된다고 한다. 또 Boot, Security, Data, Cloud, Batch 같은 다른 프로젝트는 각각 별도의 소스 저장소, 이슈 트래커, 릴리스 주기를 가진다고 설명하며, Boot는 Framework 기반으로 관례 우선(convention over configuration)을 따라 빠르게 시작하도록 설계되었다고 한다. Spring Data Commons 문서는 이 프로젝트가 핵심 스프링 개념을 다양한 관계형·비관계형 저장소에 적용한다고 하고, 중심 인터페이스가 `Repository`라고 설명한다. Boot 문서는 릴리스마다 검증된 의존성 목록을 제공해 버전을 직접 적지 않아도 되고(BOM), 스타터는 의존성 묶음이며, 자동 설정은 추가한 jar에 따라 구성하되 직접 정의한 빈이 있으면 해당 부분은 물러난다고 한다. 내장 서버는 Tomcat과 Jetty를 지원한다. 목표로 내장 서버, 보안, 메트릭, 헬스 체크, 외부 설정 같은 비기능 기능 제공을 든다. Boot 4.0 릴리스 노트의 의존성 업그레이드 항목에는 Spring Framework 7.0과 Spring Security 7.0, Spring Data 2025.1이 포함되어 있다.

(보충) Boot 없이 Framework만으로도 앱을 만들 수 있지만 설정이 많아진다는 설명은 일반적인 정리다. 문서는 Boot 기반으로 시작하라고 권하고 Boot 앱은 설정이 거의 필요 없다고 하지만, "Framework만 쓰면 설정이 얼마나 늘어나는지"를 직접 비교한 문장은 확인하지 못했다.
