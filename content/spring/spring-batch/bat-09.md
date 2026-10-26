---
slug: "bat-09"
topic: "spring-batch"
tier: DEEP
difficulty: 2
title: "실패한 잡을 재시작하면 어디서부터 다시 시작하나요?"
keywords: ["같은 식별 파라미터로 재실행", "COMPLETED 스텝은 건너뜀", "ExecutionContext의 상태 복원", "ItemStream open·update", "allowStartIfComplete와 startLimit"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-batch/reference/step/chunk-oriented-processing/restart.html", "https://docs.spring.io/spring-batch/reference/readers-and-writers/item-stream.html", "https://docs.spring.io/spring-batch/reference/domain.html", "https://docs.spring.io/spring-batch/reference/job/configuring-job.html"]
concepts: [batch-job-metadata]
importance: 2
links: [{to: "bat-08", kind: PREREQ}, {to: "bat-20", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
같은 식별 파라미터로 다시 실행하면 기존 JobInstance의 재시작으로 보고, 이미 COMPLETED인 스텝은 건너뛰고 실패한 스텝부터 시작합니다. 스텝 안에서는 리더 같은 ItemStream이 커밋 직전에 update로 현재 위치를 ExecutionContext에 저장하고, 재시작 때 open에서 그 값을 읽어 이어서 읽습니다. 완료된 스텝도 항상 돌리고 싶으면 allowStartIfComplete를, 스텝의 시작 횟수를 제한하려면 startLimit를 씁니다. 잡에 preventRestart를 걸면 재시작이 막힙니다.

(공식 문서) Configuring a Step for Restart 페이지는 재시작된 잡에서 COMPLETED인 스텝은 건너뛰고, allow-start-if-complete(Java에서는 allowStartIfComplete)로 이를 덮어쓸 수 있다고 한다. startLimit를 넘겨 다시 시작하면 StartLimitExceededException이 나며 기본값은 `Integer.MAX_VALUE`다. ItemStream 페이지는 update가 커밋 전에 호출되어 현재 상태를 ExecutionContext에 넣고, open은 저장된 값으로 시작 위치를 정하는 데 쓸 수 있다고 한다. Domain Language 페이지는 플랫 파일 예제에서 읽은 줄 수를 컨텍스트에 저장해 재시작 때 그 줄까지 건너뛰는 코드를 보여 준다. 스텝용 ExecutionContext는 스텝의 각 커밋 지점에 저장된다.
(실험하지 않았다) 문서 근거로만 썼다.
