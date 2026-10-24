---
slug: "osp-18"
topic: "cs-os-process"
tier: TRICKY
difficulty: 3
title: "기아(starvation)와 우선순위 역전은 무엇이고 어떻게 해결하나요?"
keywords: ["우선순위가 낮아 계속 밀림", "에이징", "락 보유자가 높은 스레드를 막음", "우선순위 상속", "우선순위 천장"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://pubs.opengroup.org/onlinepubs/9799919799/basedefs/V1_chap03.html", "https://pubs.opengroup.org/onlinepubs/9799919799/functions/pthread_mutexattr_getprotocol.html", "https://www.kernel.org/doc/html/latest/locking/rt-mutex.html", "https://man7.org/linux/man-pages/man7/sched.7.html", "https://pages.cs.wisc.edu/~remzi/OSTEP/"]
refs: ["OSTEP, Locks (threads-locks), Aside: More Reason To Avoid Spinning: Priority Inversion, PDF p.17", "OSTEP, Locks (threads-locks), 28.4 Evaluating Locks(공정성과 기아), PDF p.3", "OSTEP, Scheduling: The Multi-Level Feedback Queue (cpu-sched-mlfq), 8.2-8.3 starvation and priority boost, PDF p.5-7"]
concepts: [race-condition, process-management]
importance: 1
---
**모범 답변 (30~60초)**
기아는 준비 상태인데도 더 우선하는 작업에 계속 밀려 CPU나 자원을 오래 받지 못하는 상태입니다. 오래 기다린 작업의 우선순위를 올리는 에이징으로 줄입니다. 우선순위 역전은 높은 우선순위 스레드가 낮은 우선순위 스레드가 쥔 락을 기다리는 동안, 중간 우선순위 스레드가 낮은 스레드를 계속 선점해 결과적으로 중간 스레드가 높은 스레드보다 먼저 도는 현상입니다. 락 보유자가 대기자의 높은 우선순위를 물려받는 우선순위 상속이나 락을 쥔 동안 미리 정한 천장 우선순위로 올리는 우선순위 천장으로 막고, POSIX 뮤텍스에서는 선택 기능인 PTHREAD_PRIO_INHERIT와 PTHREAD_PRIO_PROTECT입니다.

(공식 문서) POSIX 정의 3.275는 우선순위 역전을 자발적으로 멈춘 것이 아닌 더 높은 우선순위 스레드가 실행되지 못하는 동안 더 낮은 우선순위 스레드가 실행되는 상태로, 흔히 공유 자원 경합 때문에 생긴다고 한다. pthread_mutexattr_setprotocol 문서는 기본값이 PTHREAD_PRIO_NONE이고, PTHREAD_PRIO_INHERIT 뮤텍스를 쥐어 높은 우선순위 스레드를 막고 있는 소유자는 대기자 중 가장 높은 우선순위로 실행되며 소유자가 다른 INHERIT 뮤텍스에서 막히면 재귀적으로 전파한다고 하고, PTHREAD_PRIO_PROTECT는 소유 중에 뮤텍스들의 우선순위 천장 중 가장 높은 값으로 실행한다고 한다(두 프로토콜은 해당 선택 기능을 지원하는 구현에서만 쓸 수 있다). 커널 rt-mutex 문서는 PI-futex가 PTHREAD_PRIO_INHERIT를 지원하고 낮은 우선순위 소유자가 높은 우선순위 대기자의 우선순위를 물려받으며 해제되면 즉시 부스팅이 사라진다고 설명한다. sched(7)는 SCHED_OTHER가 못 돈 퀀텀마다 동적 우선순위를 올려 공정한 진행을 보장한다고 한다.
(실험 확인) 기아와 에이징은 osp-09의 모의 계산으로 확인했다(짧은 작업이 매 틱 도착하는 SJF에서 길이 50인 작업이 1000틱 동안 실행되지 못했고, 에이징을 쓰면 틱 148에 끝났다). 우선순위 역전과 PTHREAD_PRIO_INHERIT 동작은 이 macOS 환경에서 실시간 우선순위로 재현·검증하지 못했다.
(원저자 자료) OSTEP 락 장(threads-locks)의 우선순위 역전 박스는 높은 우선순위 T3, 중간 T2, 낮은 T1을 놓고, T1이 락을 쥔 상태에서 T3가 그 락을 기다리는 동안 T2가 T1보다 우선해 계속 실행되면 T1이 락을 풀지 못해 T3가 막히는 시나리오를 보인다. 해법으로 높은 우선순위 스레드가 기다리는 낮은 우선순위 스레드의 우선순위를 일시적으로 올려 주는 우선순위 상속을 들고, 스핀락이 원인일 때는 스핀락을 피하는 방법이 있다고 한다. 이는 POSIX 정의가 역전을 더 넓게 서술하는 것과 달리 락 보유자를 매개로 한 구체적 경우다. 기아에 대해 같은 장은 락을 두고 경쟁하는 스레드가 끝내 락을 얻지 못하는 경우를, MLFQ 장(cpu-sched-mlfq)은 대화형 작업이 많아 긴 작업이 CPU를 전혀 받지 못하는 경우를 기아로 서술하며, 후자의 해법으로 일정 시간마다 모든 작업을 최상위 큐로 올리는 우선순위 부스트를 제시한다.
(보충) 오래 기다린 작업의 우선순위를 올리는 에이징이라는 용어와 방식은 OSTEP에 없다(책의 우선순위 부스트는 주기적으로 모든 작업을 최상위 큐로 올리는 방식이다).
