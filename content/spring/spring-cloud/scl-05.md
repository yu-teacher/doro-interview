---
slug: "scl-05"
topic: "spring-cloud"
tier: BASIC
difficulty: 1
title: "서비스 디스커버리는 왜 필요하고, 스프링 클라우드에서는 `DiscoveryClient`와 Eureka를 어떻게 쓰나요?"
keywords: ["서비스 이름으로 인스턴스 조회", "DiscoveryClient 추상화", "Eureka 레지스트리와 하트비트", "구현체가 있으면 자동 등록", "클라이언트 측 캐시"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-cloud-commons/reference/spring-cloud-commons/common-abstractions.html", "https://docs.spring.io/spring-cloud-netflix/reference/spring-cloud-netflix.html", "https://spring.io/projects/spring-cloud-netflix", "https://github.com/spring-cloud/spring-cloud-netflix", "https://github.com/spring-cloud/spring-cloud-release/wiki/Spring-Cloud-2020.0-Release-Notes", "https://github.com/spring-cloud/spring-cloud-release/wiki/Spring-Cloud-2025.0-Release-Notes", "https://github.com/spring-cloud/spring-cloud-release/wiki/Spring-Cloud-2025.1-Release-Notes"]
concepts: [service-discovery]
importance: 3
links: [{to: "scl-06", kind: FOLLOWUP}, {to: "scl-18", kind: FOLLOWUP}, {to: "dst-08", kind: RELATED}]
---
**모범 답변 (30~60초)**
인스턴스 주소가 자주 바뀌는 환경에서 호출 대상을 수동 설정이나 관례로 맞추면 깨지기 쉬워서, 서비스 이름으로 현재 인스턴스를 찾는 레지스트리가 필요합니다. 스프링 클라우드 커먼즈는 `DiscoveryClient`와 `ServiceRegistry` 추상화를 제공해 Eureka, Consul, Zookeeper 같은 구현을 같은 방식으로 쓰게 하고, 구현체가 클래스패스에 있으면 로컬 서버가 자동 등록됩니다. Eureka 클라이언트는 호스트, 포트, 헬스 URL 같은 메타데이터로 등록하고 주기적으로 하트비트를 보내며, 하트비트가 설정된 시간 안에 오지 않으면 보통 레지스트리에서 제거됩니다. 클라이언트도 레지스트리를 메모리에 캐시합니다.

(공식 문서) Commons 공통 추상화 문서는 서비스 디스커버리, 로드 밸런싱, 서킷 브레이커 같은 패턴이 구현과 무관한 공통 추상화 계층을 갖는다고 쓰고, `DiscoveryClient`와 `ReactiveDiscoveryClient` 구현으로 Eureka, Consul, Zookeeper 디스커버리를 예로 든다. `@EnableDiscoveryClient`는 더 이상 필수가 아니고 구현체를 클래스패스에 두면 앱이 서비스 디스커버리 서버에 등록되며, `ServiceRegistry`의 구현은 기본으로 실행 중인 서비스를 자동 등록한다. 레지스트리 기반 구현이 없으면 프로퍼티로 인스턴스를 적는 `SimpleDiscoveryClient`가 쓰인다.
(공식 문서) Spring Cloud Netflix 문서는 Eureka가 Netflix의 서비스 디스커버리 서버와 클라이언트이고, 클라이언트가 호스트와 포트, 헬스 지표 URL, 홈페이지 같은 메타데이터로 등록하며 인스턴스마다 하트비트를 받아 설정된 시간표 안에 실패하면 보통 레지스트리에서 제거된다고 한다. 서버는 별도 백엔드 저장소가 없고 인스턴스들의 하트비트로 등록 정보를 메모리에서 유지하며, 클라이언트도 레지스트리의 메모리 캐시를 가진다. 서버는 `spring-cloud-starter-netflix-eureka-server`와 `@EnableEurekaServer`로 띄운다.
(공식 문서) Eureka의 현재 상태는 이렇게 확인했다. spring.io의 Spring Cloud Netflix 프로젝트 페이지는 기능으로 Eureka 서비스 디스커버리만 나열하고, 2020.0 릴리스 노트는 Archaius, Hystrix, Ribbon, Zuul, Turbine 등의 모듈이 제거됐다고 밝힌다. 위 Netflix 문서, 프로젝트 페이지와 깃허브 저장소 첫 화면, 2025.0과 2025.1 릴리스 노트에서 Eureka를 유지보수 모드로 표기한 문장은 찾지 못했다. 2025.1.0 릴리스 노트에도 Netflix 5.0.0이 포함돼 있다.
