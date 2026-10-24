---
slug: "osp-02"
topic: "cs-os-process"
tier: BASIC
difficulty: 1
title: "프로세스 상태에는 무엇이 있고, 리눅스에서는 어떻게 표시되나요?"
keywords: ["생성·준비·실행·대기·종료", "준비 큐에서 CPU 할당", "I/O 대기는 대기 상태", "R·S·D 상태 문자", "Z는 좀비"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://man7.org/linux/man-pages/man5/proc_pid_stat.5.html", "https://man7.org/linux/man-pages/man7/sched.7.html", "https://man7.org/linux/man-pages/man1/ps.1.html"]
concepts: [process-management]
importance: 2
links: [{to: "osp-08", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
교과서 모델에서 프로세스는 생성, 준비, 실행, 대기, 종료 상태를 오갑니다. 준비는 CPU만 받으면 돌 수 있는 상태로 준비 큐에서 기다리고, 스케줄러가 고르면 실행이 됩니다. 실행 중 시간이 다 되거나 더 높은 우선순위에 밀리면 준비로 돌아가고, I/O 완료 같은 이벤트를 기다리면 대기로 가며 이벤트가 오면 준비로 갑니다. 리눅스는 /proc/PID/stat에 R(실행), S(인터럽트 가능한 대기), D(인터럽트 불가 디스크 대기), T(정지), Z(좀비) 같은 문자로 상태를 보여 줍니다.

(공식 문서) proc_pid_stat(5)는 state 필드가 R Running, S Sleeping in an interruptible wait, D Waiting in uninterruptible disk sleep, Z Zombie, T Stopped (on a signal), t Tracing stop, X Dead, I Idle(Linux 4.14부터) 등의 문자라고 정의한다. sched(7)는 스케줄러를 실행 가능한(runnable) 스레드 중 다음에 CPU가 실행할 것을 정하는 커널 구성요소라고 설명한다.
(실험 확인) macOS 26.6.2(Darwin 25.6.0), Apple M5 Pro, Apple clang 21. ps의 stat 열이 sleep 중인 프로세스는 S, CPU를 계속 쓰는 프로세스는 R, SIGSTOP을 받은 프로세스는 T, 종료했지만 wait되지 않은 자식은 Z로 나왔고 wait 뒤에는 사라졌다. macOS의 ps 결과라서 리눅스의 /proc 문자와 같은 체계라는 뜻은 아니다.
(보충) 생성·준비·실행·대기·종료의 5상태 모델과 전이 설명은 교과서 일반 모델이며 공식 문서가 이 이름들을 정의하지는 않는다. proc_pid_stat(5)는 R을 Running으로만 적지만 ps(1) 문서는 R을 "running or runnable (on run queue)", 곧 실행 중이거나 실행 가능한 상태로 적는다.
