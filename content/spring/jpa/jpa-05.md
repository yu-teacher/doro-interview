---
slug: "jpa-05"
topic: "jpa"
tier: BASIC
difficulty: 1
title: "쓰기 지연과 flush는 언제 일어나나요?"
keywords: ["쓰기 지연", "auto-flush", "커밋 전 flush", "쿼리 실행 전 flush", "네이티브 SQL 주의", "flush != commit"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
`persist`나 값 변경은 바로 SQL이 되지 않고 영속성 컨텍스트의 액션 큐에 쌓이다가 flush 때 한꺼번에 DB로 나갑니다. **(공식)** Hibernate 입문서에 따르면 flush는 보통 트랜잭션 커밋 시, 결과에 영향을 줄 수 있는 쿼리 실행 전(auto-flush), 그리고 명시적 `flush()` 호출 시 일어납니다. 네이티브 SQL은 기본적으로 auto-flush 대상이 아니라고 합니다. flush는 커밋이 아니라 SQL을 DB로 보내는 것이어서, 트랜잭션이 롤백되면 되돌려집니다. 플러시 모드는 COMMIT, MANUAL 등이 있고 COMMIT 모드는 stale한 쿼리 결과가 나올 수 있다고 문서가 경고합니다.
