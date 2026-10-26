---
slug: "bat-13"
topic: "spring-batch"
tier: DEEP
difficulty: 2
title: "Spring Batch에서 처리량을 높이는 병렬·확장 방법에는 무엇이 있나요?"
keywords: ["먼저 단일 스레드로 측정", "멀티스레드 스텝", "병렬 스텝(split)", "로컬·리모트 청킹", "파티셔닝"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-batch/reference/scalability.html", "https://docs.spring.io/spring-batch/reference/whatsnew.html"]
concepts: [thread-pool, batch-job-metadata]
importance: 1
links: [{to: "bat-04", kind: PREREQ}, {to: "bat-14", kind: FOLLOWUP}, {to: "bat-19", kind: FOLLOWUP}, {to: "jt-13", kind: RELATED}]
---
**모범 답변 (30~60초)**
문서는 먼저 단일 스레드·단일 프로세스로 충분한지 실제에 가까운 잡으로 측정해 보라고 권합니다. 그래도 부족하면 단일 프로세스에서는 스텝에 TaskExecutor를 붙이는 멀티스레드 스텝, 서로 독립인 스텝을 동시에 돌리는 병렬 스텝, 청크를 여러 스레드가 나눠 처리하는 로컬 청킹이 있습니다. 여러 프로세스로는 메시지 미들웨어로 청크를 워커에 보내는 리모트 청킹과 6.0에 추가된 리모트 스텝이 있고, 데이터를 나눠 워커 스텝에 맡기는 파티셔닝은 단일·다중 프로세스 모두에 쓸 수 있습니다. 어느 쪽이든 커넥션 풀 같은 공유 자원이 병목이 되지 않는지 함께 봅니다.

(공식 문서) Scaling and Parallel Processing 페이지는 많은 문제가 단일 스레드·단일 프로세스로 풀리니 먼저 현실적인 잡의 성능을 측정해 보라고 하고, 병렬 처리를 단일 프로세스(멀티스레드 스텝, 병렬 스텝, 로컬 청킹)와 다중 프로세스(리모트 청킹, 파티셔닝, 리모트 스텝)로 나눈다. 풀링된 자원(예: DataSource)이 동시성 한계가 될 수 있어 풀을 원하는 스레드 수 이상으로 두라고 한다. 로컬 청킹과 리모트 스텝은 6.0 신기능이라고 What's new가 설명한다.
(실험하지 않았다) 문서 근거로만 썼다.
