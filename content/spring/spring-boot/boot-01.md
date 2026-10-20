---
slug: "boot-01"
topic: "spring-boot"
tier: BASIC
difficulty: 1
title: "Spring과 Spring Boot의 차이는 무엇인가요?"
keywords: ["자동 설정", "starter", "내장 서버", "의존성 관리", "관례 우선(Convention over Configuration)"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-boot/index.html", "https://docs.spring.io/spring-boot/reference/using/build-systems.html", "https://docs.spring.io/spring-framework/reference/index.html", "https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Release-Notes"]
---
**모범 답변 (30~60초)**
Spring Framework는 IoC 컨테이너와 DI, AOP, 트랜잭션, Spring MVC 같은 핵심 기능을 제공하는 프레임워크이고, Spring Boot는 그 위에서 애플리케이션을 쉽게 만들고 실행하게 해 주는 도구입니다. Boot는 Spring 플랫폼과 서드파티 라이브러리에 대해 의견이 담긴 기본값을 제공해서 대부분의 앱이 Spring 설정을 거의 쓰지 않고 시작합니다. starter로 의존성을 묶고, 큐레이션된 BOM으로 버전을 맞추고, 자동 설정으로 빈을 구성하고, 내장 서버 덕분에 `java -jar`로 바로 실행합니다. 그래서 Boot는 Spring을 대체하는 게 아니라 관례 우선으로 쓰게 해 주는 레이어입니다.

- 공식 문서(Boot 소개): Boot는 실행 가능한 stand-alone, production-grade Spring 애플리케이션을 만들게 돕고, Spring 플랫폼과 서드파티 라이브러리에 대해 opinionated 한 관점을 취해 대부분의 앱이 Spring 설정을 거의 필요로 하지 않는다. 앱은 `java -jar` 또는 전통적인 war 배포로 시작할 수 있고, 코드 생성도 XML 설정 요구도 없다(네이티브 이미지 대상이 아닌 경우).
- 공식 문서(Spring Framework 문서 목차): Framework 쪽 영역으로 Core(IoC 컨테이너, AOP 등), Data Access(트랜잭션 등), Web Servlet(Spring MVC) 등이 나열된다.
- 공식 문서(Build Systems): 각 Boot 릴리스는 큐레이션된 의존성 목록(`spring-boot-dependencies` BOM)을 제공하고, 릴리스마다 기반 Spring Framework 버전이 정해져 있다. Boot 4.0은 Spring Framework 7.0 으로 이동했다(릴리스 노트).
- (보충) "관례 우선(Convention over Configuration)"은 일반적으로 쓰이는 설명 용어이며, 공식 문서의 표현은 opinionated(의견이 담긴 기본값)이다.
