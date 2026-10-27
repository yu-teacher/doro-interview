---
slug: "bat-20"
topic: "spring-batch"
tier: TRICKY
difficulty: 3
title: "배치 프로세스가 강제 종료되면 잡 상태는 어떻게 되고, 어떻게 복구하거나 안전하게 멈추나요?"
keywords: ["STARTED로 남은 실행은 재시작 불가", "recover 후 restart", "abandon은 재시작 불가", "stop은 즉시 중단 아님", "JobExecutionShutdownHook"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-batch/reference/job/advanced-meta-data.html", "https://docs.spring.io/spring-batch/reference/whatsnew.html"]
concepts: [batch-restart-recovery, graceful-shutdown]
importance: 1
links: [{to: "bat-09", kind: PREREQ}, {to: "dkr-16", kind: RELATED}, {to: "cic-14", kind: RELATED}]
---
**모범 답변 (30~60초)**
JVM이 갑자기 죽으면 Spring Batch가 상태를 갱신할 기회가 없어서 잡 실행이 STARTED 상태로 남고, 이 상태는 재시작할 수 없습니다. 6.0부터는 JobOperator의 recover로 이런 실행을 복구한 뒤 restart할 수 있습니다. 재시작하지 않고 끝내려면 abandon으로 ABANDONED 처리하며, 이 상태는 프레임워크가 재시작하지 않습니다. 안전하게 멈추려면 stop을 쓰는데, 즉시 중단되는 것이 아니라 제어가 프레임워크로 돌아온 시점에 스텝과 잡 실행을 STOPPED로 저장합니다. 6.0의 JobExecutionShutdownHook을 JVM 종료 훅으로 달면 외부 종료 신호에도 정상 중지를 시도합니다.

(공식 문서) Advanced Metadata Usage 페이지는 stop 후 종료가 즉시가 아니며 비즈니스 코드를 강제로 멈출 방법이 없어, 제어가 프레임워크로 돌아오면 현재 StepExecution과 JobExecution을 STOPPED로 저장한다고 한다. 6.0부터 JobExecutionShutdownHook을 런타임 종료 훅으로 붙여 외부 인터럽트 신호에 정상 중지를 시도할 수 있고, 정상 종료가 안 되면 실행이 재시작 불가 상태인 STARTED로 남으므로 recover 뒤 restart하라고 한다. FAILED 실행은 재시작 가능한 잡이면 재시작할 수 있고 ABANDONED 실행은 프레임워크가 재시작하지 않는다. 프로세스가 죽은 뒤 상태를 FAILED로 바꾸는 것은 재시작 가능하고 재시작 데이터가 유효할 때만 해야 하는 업무 판단이라고 한다. What's new 페이지는 recover 메서드와 그레이스풀 셧다운이 6.0 신기능이라고 한다.
(실험하지 않았다) 문서 근거로만 썼다.
