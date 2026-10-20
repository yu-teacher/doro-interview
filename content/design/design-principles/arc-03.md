---
slug: "arc-03"
topic: "design-principles"
tier: BASIC
difficulty: 1
title: "계층형 아키텍처(프레젠테이션-도메인-데이터)의 장점과 한계는 무엇인가요?"
keywords: ["관심사 분리로 집중 범위 축소", "도메인 로직 테스트 용이", "논리 계층과 물리 티어 구분", "큰 시스템에서는 도메인별 모듈 우선"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://martinfowler.com/bliki/PresentationDomainDataLayering.html", "https://www.domainlanguage.com/ddd/reference/", "https://alistair.cockburn.us/hexagonal-architecture/"]
concepts: [layered-architecture]
importance: 3
links: [{to: "arc-07", kind: FOLLOWUP}]
refs: ["Evans, Domain-Driven Design Reference: Definitions and Pattern Summaries (2015, CC BY 4.0), Layered Architecture, p.10"]
---
**모범 답변 (30~60초)**
가장 흔한 형태는 화면을 맡는 프레젠테이션, 업무 규칙을 담는 도메인, 저장소를 다루는 데이터 접근의 세 계층입니다. Martin Fowler는 계층을 나누면 한 번에 한 영역만 생각하면 되고, 같은 도메인 위에 여러 화면을 올릴 수 있으며, UI 없이 도메인 로직을 테스트하기 쉬워진다고 설명합니다. 다만 이것은 논리적 계층이어서 물리적 티어 구분과는 별개입니다. 시스템이 커지면 계층 하나도 복잡해지므로 최상위를 계층이 아니라 도메인별 모듈로 나누고 그 안을 계층화하라고 권하며, 계층별로 팀을 나누는 것도 안티패턴이라고 봅니다. Cockburn은 계층 경계가 잘 지켜지지 않아 로직이 새기 쉽다고 지적합니다.

(원저자 자료) Martin Fowler, "Presentation Domain Data Layering"(2015-08-26). 글은 UI·도메인 로직·데이터 접근 세 계층 분리가 많은 애플리케이션에서 효과적이라고 하고, 이점으로 주의 범위를 좁히는 효과, 한 도메인 위에 여러 프레젠테이션을 얹는 교체 가능성, 테스트 용이성을 든다. 데이터 소스 교체 때문에 분리한다는 말은 자주 듣지만 실제로 교체하는 경우는 드물다고도 적는다. 이 계층은 물리 티어가 아닌 논리 계층이고, 세 계층 외에도 서비스 계층 등으로 늘 수 있으며, 큰 시스템의 최상위 모듈을 이 세 계층으로 나누지 말고 도메인 지향 모듈로 나눈 뒤 내부를 계층화하라고 한다. 계층별 팀 분리는 안티패턴이라고 한다.
(원저자 자료) Eric Evans, `Domain-Driven Design Reference`(2015), 쪽 10 Layered Architecture는 도메인 모델과 비즈니스 로직을 격리해 인프라·UI 의존을 없애고, 각 계층이 아래 계층에만 의존하게 나누라고 한다. 이 글은 핵심 목표가 격리이며 Hexagonal Architecture 같은 패턴이 더 나을 수도 있다고 덧붙인다. Alistair Cockburn의 원 논문은 계층 그림의 선을 사람들이 진지하게 받아들이지 않아 로직이 경계를 넘어 샌다고 주장한다.
