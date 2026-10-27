---
slug: "osp-02"
topic: "cs-os-process"
tier: BASIC
difficulty: 1
title: "프로세스 상태에는 무엇이 있고, 리눅스에서는 어떻게 표시되나요?"
keywords: ["생성·준비·실행·대기·종료", "준비 큐에서 CPU 할당", "I/O 대기는 대기 상태", "R·S·D 상태 문자", "Z는 좀비"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://man7.org/linux/man-pages/man5/proc_pid_stat.5.html", "https://man7.org/linux/man-pages/man7/sched.7.html", "https://man7.org/linux/man-pages/man1/ps.1.html", "https://pages.cs.wisc.edu/~remzi/OSTEP/"]
refs: ["OSTEP, The Abstraction: The Process (cpu-intro), 4.4 Process States, PDF p.5-7", "OSTEP, The Abstraction: The Process (cpu-intro), 4.5 Data Structures(초기·최종 상태), PDF p.8-9", "OSTEP, Scheduling: Introduction (cpu-sched), 7.7 Round Robin(타임 슬라이스와 실행 큐), PDF p.7", "OSTEP, Scheduling: The Multi-Level Feedback Queue (cpu-sched-mlfq), 8.1 MLFQ: Basic Rules, PDF p.2"]
concepts: [process-management]
importance: 2
links: [{to: "osp-08", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
교과서 모델에서 프로세스는 생성, 준비, 실행, 대기, 종료 상태를 오갑니다. 준비는 CPU만 받으면 돌 수 있는 상태로 준비 큐에서 기다리고, 스케줄러가 고르면 실행이 됩니다. 실행 중 시간이 다 되거나 더 높은 우선순위에 밀리면 준비로 돌아가고, I/O 완료 같은 이벤트를 기다리면 대기로 가며 이벤트가 오면 준비로 갑니다. 리눅스는 /proc/PID/stat에 R(실행), S(인터럽트 가능한 대기), D(인터럽트 불가 디스크 대기), T(정지), Z(좀비) 같은 문자로 상태를 보여 줍니다.

(공식 문서) proc_pid_stat(5)는 state 필드가 R Running, S Sleeping in an interruptible wait, D Waiting in uninterruptible disk sleep, Z Zombie, T Stopped (on a signal), t Tracing stop, X Dead, I Idle(Linux 4.14부터) 등의 문자라고 정의한다. sched(7)는 스케줄러를 실행 가능한(runnable) 스레드 중 다음에 CPU가 실행할 것을 정하는 커널 구성요소라고 설명한다. 한편 proc_pid_stat(5)는 R을 Running으로만 적지만 ps(1) 문서는 R을 "running or runnable (on run queue)", 곧 실행 중이거나 실행 가능한 상태로 적는다.
(실험 확인) macOS 26.6.2(Darwin 25.6.0), Apple M5 Pro, Apple clang 21. ps의 stat 열이 sleep 중인 프로세스는 S, CPU를 계속 쓰는 프로세스는 R, SIGSTOP을 받은 프로세스는 T, 종료했지만 wait되지 않은 자식은 Z로 나왔고 wait 뒤에는 사라졌다. macOS의 ps 결과라서 리눅스의 /proc 문자와 같은 체계라는 뜻은 아니다.
(원저자 자료) OSTEP 프로세스 장(cpu-intro) 4.4절은 단순화한 모델에서 프로세스 상태를 실행(running), 준비(ready), 대기(blocked)로 둔다. 준비에서 실행으로 옮겨지는 것을 스케줄됨, 실행에서 준비로 돌아가는 것을 디스케줄됨이라 하고, 디스크 I/O 요청처럼 어떤 사건을 기다리면 대기가 되었다가 사건이 끝나면 준비로 돌아간다고 설명한다. 같은 장 4.5절은 이 세 상태 밖에 프로세스를 만드는 동안의 초기 상태와, 종료했지만 아직 정리되지 않아 부모가 종료 코드를 확인할 수 있게 남겨 둔 최종 상태(UNIX에서는 좀비)가 있다고 하므로, 모범 답변의 생성·종료는 이 초기·최종 상태에 해당한다. 책은 대기를 blocked라는 이름으로 부른다. 실행에서 준비로 돌아가는 계기는 다른 장에 있다. 스케줄링 입문 장(cpu-sched) 7.7절의 RR은 작업을 타임 슬라이스만큼 돌린 뒤 실행 큐의 다음 작업으로 넘기고, MLFQ 장(cpu-sched-mlfq) 8.1절은 우선순위가 더 높은 작업이 먼저 실행된다는 규칙을 둔다.
