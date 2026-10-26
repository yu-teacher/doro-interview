---
slug: "bat-16"
topic: "spring-batch"
tier: DEEP
difficulty: 2
title: "커밋 간격(청크 크기)은 어떻게 정하나요? 너무 작거나 크면 무슨 문제가 있나요?"
keywords: ["커밋 간격 1은 트랜잭션 비용", "데이터·자원에 따라 달라짐", "온라인과 겹칠 때 락 시간", "실제 규모로 측정"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-batch/reference/step/chunk-oriented-processing/commit-interval.html", "https://docs.spring.io/spring-batch/reference/spring-batch-architecture.html"]
concepts: [tx-boundary, batch-job-metadata]
importance: 2
links: [{to: "bat-04", kind: PREREQ}, {to: "bat-17", kind: FOLLOWUP}, {to: "jpa-05", kind: RELATED}, {to: "jpa-30", kind: RELATED}]
---
**모범 답변 (30~60초)**
커밋 간격이 1이면 아이템마다 트랜잭션을 시작하고 커밋하는 비용이 들어 비효율적이라서, 문서는 가능한 한 많은 아이템을 한 트랜잭션에서 처리하는 것이 이상적이라고 합니다. 다만 얼마가 알맞은지는 데이터 종류와 연동하는 자원에 달려 있다고만 하고 정해진 값은 주지 않습니다. 크게 잡을수록 한 청크가 실패했을 때 롤백되고 다시 처리할 범위가 커지고, 온라인과 같은 데이터를 건드리는 잡이면 락을 오래 잡게 됩니다. 문서는 동시 온라인 처리와 겹칠 때 몇 초 넘게 잠그지 말고 자주 나눠 커밋하라고 권합니다. 그래서 실제 데이터 규모로 측정해서 정합니다.

(공식 문서) The Commit Interval 페이지는 커밋 간격 1이면 아이템마다 커밋해 트랜잭션 시작·커밋이 비싸니 이상적이지 않고, 가능한 한 많이 처리하는 편이 낫지만 얼마가 알맞은지는 데이터 종류와 스텝이 쓰는 자원에 달렸다고 한다. Spring Batch Architecture 페이지는 온라인 사용자가 동시에 갱신할 수 있는 데이터를 배치가 몇 초를 넘겨 잠그면 안 되고, 몇 트랜잭션마다 커밋해 잠기는 범위와 시간을 줄이라고 권고한다.
(보충) 청크가 트랜잭션 경계라는 문서 내용에서 오는 추론으로, 청크를 크게 잡으면 실패 시 롤백되고 다시 처리할 범위도 커지고 온라인과 겹치는 데이터는 락을 오래 잡게 된다. 이 연결을 직접 설명한 문장은 읽은 문서에서 찾지 못했다.
(실험하지 않았다) 문서 근거로만 썼다.
