---
slug: "dst-03"
topic: "design-distributed"
tier: BASIC
difficulty: 2
title: "마이크로서비스의 경계는 어떤 기준으로 나누나요?"
keywords: ["비즈니스 역량 기준", "바운디드 컨텍스트", "기술 계층 분할의 문제", "chatty 호출은 합치라는 신호", "애매하면 굵게 시작"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://martinfowler.com/articles/microservices.html", "https://martinfowler.com/bliki/BoundedContext.html", "https://www.domainlanguage.com/ddd/reference/", "https://learn.microsoft.com/en-us/azure/architecture/microservices/model/microservice-boundaries"]
concepts: [msa-boundary, ddd]
importance: 2
links: [{to: "dst-06", kind: FOLLOWUP}, {to: "arc-09", kind: RELATED}, {to: "arc-10", kind: RELATED}]
refs: ["Evans, Domain-Driven Design Reference: Definitions and Pattern Summaries (2015, CC BY 4.0), Bounded Context, PDF p.9 (문서 쪽번호 2)"]
---
**모범 답변 (30~60초)**
기술 계층이 아니라 비즈니스 기능을 기준으로 나눕니다. Fowler와 Lewis는 UI팀, 서버팀, DB팀으로 나누면 간단한 변경도 여러 팀을 거치는 프로젝트가 되므로, 서비스 하나가 UI부터 저장소까지 한 비즈니스 영역을 맡는 구성을 설명합니다. 경계를 찾는 도구로는 DDD의 바운디드 컨텍스트가 쓰이는데, 하나의 모델이 적용되는 범위를 팀, 코드베이스, DB 스키마까지 명시하는 것입니다. Azure 가이드는 서비스가 한 바운디드 컨텍스트를 넘지 않게 하고, 서비스 사이 호출이 지나치게 잦거나 함께 배포해야 하면 경계를 다시 보라고 합니다. 애매하면 굵게 시작하는 편이 낫습니다.

(원저자 자료) Fowler·Lewis의 "Microservices"는 기술 계층별 팀 구성이 간단한 변경도 팀 간 프로젝트로 만든다고 보고(콘웨이 법칙의 사례), 서비스를 비즈니스 역량 기준으로 나누고 팀도 교차 기능으로 꾸린다고 설명한다. 서비스와 DDD 바운디드 컨텍스트 경계 사이에는 자연스러운 대응이 있다고 하고, 두 서비스를 반복해서 함께 바꾸게 된다면 합쳐야 한다는 신호라고도 쓴다. Fowler의 "Bounded Context"(2014-01-15)는 큰 도메인에서 하나의 통합 모델이 비현실적이므로 컨텍스트별로 나누고 관계를 명시한다고 설명하며, 가장 큰 경계 요인은 보통 조직 문화(언어)라고 한다.
(원저자 자료) Evans의 "DDD Reference"(CC BY 4.0, PDF 9쪽, 문서 쪽번호 2)는 모델이 적용되는 맥락을 팀 조직, 애플리케이션의 특정 부분, 코드베이스와 DB 스키마 같은 물리적 표현의 관점에서 명시적으로 정의하라고 한다.
(공식 문서) Azure Architecture Center "Identify microservice boundaries"는 한 서비스의 기능이 하나의 바운디드 컨텍스트를 넘지 않아야 하고, 집합체(aggregate)가 흔히 좋은 서비스 후보라고 한다. 검증 기준으로 단일 책임, 서비스 간 chatty 호출이 없을 것(둘로 쪼갠 결과가 지나치게 chatty하면 같은 서비스에 속한다는 증상일 수 있다고 설명), 함께 배포해야 하는 의존이 없을 것 등을 들고, 의문이 들면 굵은 서비스로 시작하라고 권한다(하나를 둘로 쪼개는 쪽이 여러 서비스 사이로 기능을 옮기는 것보다 쉽다고 설명).
