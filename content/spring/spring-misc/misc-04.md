---
slug: "misc-04"
topic: "spring-misc"
tier: BASIC
difficulty: 1
title: "Spring Framework, Spring Boot, Spring MVC, Spring Data의 관계는?"
keywords: ["Framework = 코어", "MVC = 웹 모듈", "Data = 별도 프로젝트", "Boot = 자동 설정·스타터·내장 서버"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
Spring Framework는 IoC 컨테이너, AOP, 트랜잭션, 테스트 같은 핵심 기반입니다. Spring MVC는 그 Framework 안에 들어 있는 서블릿 기반 웹 모듈이고, 리액티브 쪽은 WebFlux가 따로 있습니다. Spring Data는 Framework 위에서 JPA, MongoDB 등의 리포지토리 추상화를 제공하는 별도 프로젝트이고, Spring Security도 마찬가지로 별도 프로젝트입니다. Spring Boot는 이것들을 새로 만든 기술이 아니라, 의존성 버전을 맞춰 주는 스타터, 조건부 자동 설정, 내장 서버, 외부 설정, Actuator 등으로 "쉽게 조립해서 바로 실행"하게 해 주는 도구입니다. 그래서 Boot 없이도 Framework만으로 앱을 만들 수 있지만 설정이 많아집니다.

(공식) Spring Boot 4.0 릴리스 노트의 의존성 업그레이드 항목에 Spring Framework 7.0이 포함되어 있다 (Boot 4 = Framework 7 기반).
(보충) 구성 요소별 역할 구분은 일반 지식이다.
