---
slug: "bat-04"
topic: "spring-batch"
tier: BASIC
difficulty: 1
title: "청크 지향 처리는 어떻게 동작하고, 커밋 간격(chunk size)은 무엇인가요?"
keywords: ["아이템을 하나씩 읽어 청크로 모음", "커밋 간격만큼 모이면 쓰기", "청크 단위 트랜잭션", "ItemProcessor로 가공·제외"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-batch/reference/step/chunk-oriented-processing.html", "https://docs.spring.io/spring-batch/reference/step/chunk-oriented-processing/commit-interval.html", "https://docs.spring.io/spring-batch/reference/whatsnew.html"]
concepts: [batch-job-metadata, tx-boundary]
importance: 3
links: [{to: "bat-05", kind: FOLLOWUP}, {to: "bat-16", kind: FOLLOWUP}, {to: "jpa-30", kind: RELATED}]
---
**모범 답변 (30~60초)**
청크 지향 처리는 아이템을 하나씩 읽어 모으다가, 읽은 개수가 커밋 간격에 도달하면 모인 묶음을 ItemWriter가 한 번에 쓰고 트랜잭션을 커밋하는 방식입니다. 중간에 ItemProcessor를 두면 읽은 아이템을 가공해 writer에 넘기고, 프로세서가 null을 반환한 아이템은 쓰기 대상에서 빠집니다. 즉 트랜잭션 경계는 아이템 하나가 아니라 청크 하나입니다. 커밋 간격이 10이면 열 건마다 한 트랜잭션이 커밋되고, 문서의 의사 코드도 그만큼 읽은 뒤 writer를 한 번 호출하는 모양입니다.

(공식 문서) Chunk-oriented Processing 페이지는 아이템을 하나씩 읽어 청크를 만들고 트랜잭션 경계 안에서 쓴다고 설명한다. 읽은 수가 커밋 간격과 같아지면 ItemWriter가 청크 전체를 쓰고 그 뒤에 트랜잭션이 커밋된다. ItemProcessor는 선택이고, 프로세서가 null을 반환하면 그 아이템은 writer에 전달되는 목록에 담기지 않는다. The Commit Interval 페이지는 시작 시 트랜잭션을 열고 read 호출마다 카운터를 올리며 커밋 간격에 닿으면 목록을 writer에 넘기고 커밋한다고 한다.
(공식 문서) What's new 페이지에 따르면 이 모델의 새 구현인 ChunkOrientedStep이 6.0에서 정식으로 들어와 이전의 ChunkOrientedTasklet과 TaskletStep을 대체한다. Configuring a Step 페이지의 예제는 StepBuilder 기반이고 What's new의 예제는 ChunkOrientedStepBuilder를 쓰므로, 설정 코드는 쓰는 버전에 맞춰 확인한다.
(실험하지 않았다) 문서 근거로만 썼다.
