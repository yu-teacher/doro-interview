---
slug: "bat-12"
topic: "spring-batch"
tier: DEEP
difficulty: 2
title: "커서 기반 리더와 페이징 기반 리더는 어떻게 다르고 어떻게 고르나요?"
keywords: ["ResultSet 커서로 스트리밍", "페이지 단위로 쿼리 반복", "sortKey 유일성", "대용량 결과를 메모리에 다 올리지 않음"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-batch/reference/readers-and-writers/database.html", "https://docs.spring.io/spring-batch/reference/step/chunk-oriented-processing/retry-logic.html"]
concepts: [batch-job-metadata, spring-data-jpa]
importance: 1
links: [{to: "bat-04", kind: PREREQ}, {to: "jpa-30", kind: RELATED}]
---
**모범 답변 (30~60초)**
둘 다 큰 결과를 한꺼번에 메모리에 올리지 않으려는 방법입니다. 커서 방식인 JdbcCursorItemReader는 시작할 때 커서를 열고 read마다 한 행씩 앞으로 가며, 읽는 동안 ResultSet을 유지합니다. 페이징 방식인 JdbcPagingItemReader와 JpaPagingItemReader는 페이지 크기만큼씩 쿼리를 여러 번 보내고, 각 페이지가 독립된 쿼리입니다. 페이징은 정렬 키가 필요하고 문서는 데이터 누락을 막으려면 그 키가 유일해야 한다고 합니다. 커서는 연결을 계속 들고 있어 연결과 트랜잭션 설정을 따져 보고 고릅니다.

(공식 문서) Database 페이지는 쿼리 결과가 수백만 행이면 결과를 메모리에 다 들고 있을 수 있어 커서 기반과 페이징 기반 두 방식이 있다고 한다. 커서 리더는 초기화 때 커서를 열고 read마다 한 행 전진한다. JdbcCursorItemReader는 기본적으로 자체 커넥션으로 커서를 열어 스텝의 트랜잭션에 참여하지 않으며, 공유 커넥션 옵션을 켜면 커밋을 넘어 커서를 유지하는 설정(`HOLD_CURSORS_OVER_COMMIT`)을 쓴다고 한다. 페이징 리더는 페이지 크기만큼 쿼리를 나눠 보내며, JdbcPagingItemReader는 PagingQueryProvider와 sortKey가 필요하고 데이터 손실을 막으려면 sortKey에 유니크 제약이 있어야 한다고 한다. JpaPagingItemReader는 페이지를 읽을 때마다 엔티티를 detach하고 영속성 컨텍스트를 비운다. Configuring Retry Logic 페이지는 커서 리더가 ResultSet과 Connection을 호출 사이에 유지하고 페이징 리더는 페이지마다 독립 쿼리를 쓴다고 대비한다.
(실험하지 않았다) 문서 근거로만 썼다. 어느 쪽이 더 빠르다는 주장은 하지 않는다.
