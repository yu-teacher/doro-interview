---
slug: "jpa-03"
topic: "jpa"
tier: BASIC
difficulty: 1
title: "영속성 컨텍스트란 무엇이고 어떤 이점이 있나요?"
keywords: ["1차 캐시", "동일성 보장", "쓰기 지연", "변경 감지", "Session 단명"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
영속성 컨텍스트는 엔티티를 영구 저장하는 논리적 환경으로, `EntityManager`(Hibernate에서는 `Session`)마다 하나씩 있고 일반적으로 트랜잭션 범위와 함께 갑니다. 이점은 네 가지입니다. 첫째, 1차 캐시로 같은 id 조회 시 DB를 다시 안 칩니다. 둘째, 같은 트랜잭션에서 같은 id는 같은 인스턴스를 돌려주는 동일성 보장입니다. 셋째, 쓰기 지연으로 SQL을 모아 두었다가 flush 때 보냅니다. 넷째, 변경 감지로 값만 바꿔도 UPDATE가 나갑니다. **(공식)** Hibernate 문서는 Session이 repeatable read 성격의 1차 캐시를 유지한다고 설명하고, Session은 단일 스레드·단명이라고 합니다.
