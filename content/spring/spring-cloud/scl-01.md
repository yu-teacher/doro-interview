---
slug: "scl-01"
topic: "spring-cloud"
tier: BASIC
difficulty: 1
title: "스프링 클라우드는 무엇을 해결하는 프로젝트이고, 어떤 구성요소로 이뤄지나요?"
keywords: ["분산 시스템 공통 패턴", "우산 프로젝트", "설정·디스커버리·라우팅", "로드 밸런싱·서킷 브레이커", "스프링 부트 위에 구축"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://spring.io/projects/spring-cloud", "https://docs.spring.io/spring-cloud-commons/reference/intro.html", "https://docs.spring.io/spring-cloud-kubernetes/reference/index.html"]
concepts: [msa-boundary]
importance: 3
links: [{to: "scl-03", kind: FOLLOWUP}, {to: "scl-04", kind: FOLLOWUP}, {to: "scl-05", kind: FOLLOWUP}, {to: "dst-01", kind: RELATED}]
---
**모범 답변 (30~60초)**
스프링 클라우드는 분산 시스템에서 반복되는 공통 패턴을 스프링 부트 위에서 빠르게 쓰도록 모아 둔 우산 프로젝트입니다. 공식 소개는 설정 관리, 서비스 등록과 탐색, 라우팅, 서비스 간 호출, 로드 밸런싱, 서킷 브레이커, 분산 메시징, 단기 실행 작업을 대표 기능으로 듭니다. 각 기능은 Config, Gateway, OpenFeign 같은 독립 프로젝트로 나뉘어 따로 릴리스되고, 릴리스 트레인 BOM이 호환되는 버전을 묶어 줍니다. 쿠버네티스에 배포하는 데는 필수가 아니라고 공식 문서도 밝힙니다.

(공식 문서) spring.io 스프링 클라우드 프로젝트 페이지는 분산 시스템의 공통 패턴(설정 관리, 서비스 디스커버리, 서킷 브레이커, 지능형 라우팅, 마이크로 프록시, 컨트롤 버스, 단기 실행 마이크로서비스)을 빠르게 구현하게 해 주는 도구라고 소개하고, 개발자 노트북, 베어메탈 데이터센터, 클라우드 파운드리 같은 관리형 플랫폼 어디서나 동작한다고 쓴다. 주요 프로젝트로 Config, Gateway, Netflix, Consul, Kubernetes, Function, Stream, Task, Zookeeper, OpenFeign, Bus를 나열하고, 프로젝트들은 원칙적으로 릴리스 주기가 다르며 BOM이 선별된 의존성 집합을 발행한다고 설명한다.
(공식 문서) Spring Cloud Commons 소개 절은 모든 분산 시스템 구성요소가 쉽게 쓸 수 있어야 하는 기능의 출발점으로 Spring Cloud Context(부트스트랩 컨텍스트, 암호화, 리프레시 스코프, 환경 엔드포인트)와 Spring Cloud Commons(여러 구현이 공유하는 추상화)를 든다. Spring Cloud Kubernetes 문서는 이 프로젝트가 쿠버네티스에서 스프링 클라우드 앱을 돌리는 데 유용할 수 있지만 부트 앱을 쿠버네티스에 배포하는 데 필수는 아니라고 쓴다.
