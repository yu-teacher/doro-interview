---
slug: "arc-09"
topic: "design-principles"
tier: DEEP
difficulty: 2
title: "DDD의 유비쿼터스 언어와 바운디드 컨텍스트는 무엇이며 서로 어떤 관계인가요?"
keywords: ["도메인 모델 중심의 공통 언어", "언어 변화는 모델 변화", "모델이 적용되는 명시적 경계", "컨텍스트 맵"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.domainlanguage.com/ddd/reference/"]
concepts: [ddd]
importance: 2
links: [{to: "arc-10", kind: FOLLOWUP}, {to: "dst-03", kind: RELATED}]
refs: ["Evans, Domain-Driven Design Reference: Definitions and Pattern Summaries (2015, CC BY 4.0), Definitions, p.vi", "Evans, Domain-Driven Design Reference: Definitions and Pattern Summaries (2015, CC BY 4.0), Bounded Context, p.2"]
---
**모범 답변 (30~60초)**
유비쿼터스 언어는 도메인 모델을 중심에 놓고 한 바운디드 컨텍스트 안에서 팀원 모두가 쓰는 공통 언어입니다. Eric Evans는 대화, 문서, 다이어그램, 코드에서 같은 용어를 쓰고, 언어가 바뀌는 것은 모델이 바뀌는 것이므로 클래스와 메서드 이름도 새 모델에 맞게 리팩터링하라고 합니다. 바운디드 컨텍스트는 특정 모델이 정의되고 적용되는 경계로, 팀 조직, 애플리케이션의 사용 영역, 코드베이스나 DB 스키마 같은 물리적 형태로 명시적으로 긋습니다. 큰 프로젝트에는 여러 모델이 불가피하고 표현은 맥락 안에서만 의미를 가지기 때문이며, 컨텍스트 사이의 접점은 컨텍스트 맵으로 정리합니다.

(원저자 자료) Eric Evans, `Domain-Driven Design Reference`(2015-03판 PDF, domainlanguage.com). 쪽 vi Definitions는 유비쿼터스 언어를 '한 바운디드 컨텍스트 안에서 도메인 모델을 중심으로 구조화해 모든 팀원이 활동과 소프트웨어를 잇는 데 쓰는 언어'로, 바운디드 컨텍스트를 '특정 모델이 정의되고 적용 가능한 경계(보통 하위 시스템이나 한 팀의 작업)'로 정의한다. 쪽 2 Bounded Context는 한 프로젝트에 여러 모델이 불가피하고 코드를 섞으면 버그와 혼란이 생기므로 모델이 적용되는 문맥을 명시하고, 팀 조직·애플리케이션 부분·코드베이스와 DB 스키마로 경계를 정하라고 한다. 쪽 3~4 Ubiquitous Language는 모델을 언어의 뼈대로 삼아 팀 내 모든 소통과 코드에서 쓰고, 언어의 변화는 모델의 변화라고 하며, 코드의 이름을 그에 맞게 리팩터링하라고 한다. 쪽 29 Context Map은 각 모델과 그 컨텍스트를 식별하고 접점을 지도로 그리라고 한다.
