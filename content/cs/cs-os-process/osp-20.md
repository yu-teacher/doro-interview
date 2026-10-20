---
slug: "osp-20"
topic: "cs-os-process"
tier: TRICKY
difficulty: 3
title: "리눅스의 pthread는 사용자 스레드인가요 커널 스레드인가요? 뮤텍스 잠금은 항상 시스템 콜을 부르나요?"
keywords: ["1:1 스레드 모델", "커널이 스케줄링하는 스레드", "NPTL", "futex", "경쟁 없으면 사용자 공간 처리"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://man7.org/linux/man-pages/man7/pthreads.7.html", "https://man7.org/linux/man-pages/man7/nptl.7.html", "https://man7.org/linux/man-pages/man2/wait.2.html", "https://man7.org/linux/man-pages/man2/futex.2.html", "https://pubs.opengroup.org/onlinepubs/9799919799/functions/pthread_attr_getscope.html", "https://man7.org/linux/man-pages/man3/pthread_attr_setscope.3.html", "https://www.kernel.org/doc/html/latest/locking/rt-mutex.html"]
concepts: [thread-process]
importance: 1
links: [{to: "osp-01", kind: PREREQ}, {to: "jt-15", kind: RELATED}]
---
**모범 답변 (30~60초)**
리눅스의 pthread 구현인 NPTL은 1:1 모델이라서 스레드 하나가 커널이 스케줄링하는 엔티티 하나에 대응하고 clone으로 만들어집니다. 그래서 스레드들이 여러 코어에서 동시에 실행될 수 있고, 한 스레드가 블로킹 I/O로 잠들어도 다른 스레드는 계속 돕니다. 사용자 수준 스레드는 라이브러리가 사용자 공간에서 스케줄링하는 방식이라 전환은 가볍지만 커널은 하나의 흐름으로 봅니다. 뮤텍스는 NPTL에서 futex를 써서 구현되고, futex 방식의 락은 경쟁이 없으면 원자 명령만으로 사용자 공간에서 잠그고 풀며, 이미 잠겨 있어 기다려야 할 때만 futex 시스템 콜로 커널에 들어갑니다.

(공식 문서) pthreads(7)는 NPTL이 현대의 리눅스 Pthreads 구현이고 1:1 구현이라 각 스레드가 커널 스케줄링 엔티티에 대응하며 clone(2)을 쓰고, 뮤텍스·join 같은 스레드 동기화 기본 요소를 futex(2)로 구현한다고 한다. wait(2) 리눅스 노트는 커널이 스케줄링하는 스레드가 프로세스와 별개 구조가 아니라 clone(2)으로 만든 프로세스이고 pthread_create도 clone으로 구현된다고 한다. futex(2)는 동기화 동작 대부분이 사용자 공간에서 수행되고 오래 기다려야 할 때만 futex 시스템 콜을 쓰며, 락의 경우 경쟁이 없을 때 락 상태를 원자 비교-교환 같은 사용자 모드 명령으로 바꾸고 이미 잠겨 있을 때만 futex 대기를 부른다고 설명한다. pthread_attr_setscope(3)는 리눅스가 PTHREAD_SCOPE_SYSTEM만 지원하고 PTHREAD_SCOPE_PROCESS는 지원하지 않는다고 한다.
(실험 확인) macOS 26.6.2(Darwin 25.6.0), Apple M5 Pro, Apple clang 21. CPU를 계속 쓰는 스레드 4개를 2초 동안 돌리자 프로세스의 CPU 시간이 7.98초(벽시계 2.01초의 약 4.0배)였고 스레드 1개일 때는 2.00초였다. 즉 이 환경에서도 스레드가 커널에 의해 여러 코어에 동시에 스케줄링됐다. 이 결과는 macOS의 것이고 NPTL이나 futex 확인이 아니며, futex 시스템 콜 횟수는 추적 도구가 필요해 확인하지 못했다.
(보충) 사용자 수준 스레드(M:1, N:M)의 동작과 장단점, 1:1이라서 한 스레드의 블로킹 I/O가 다른 스레드를 막지 않는다는 결론은 일반 설명이며 위 문서에 직접 없다. glibc 뮤텍스가 futex(2)가 설명하는 방식 그대로 경쟁 없을 때 시스템 콜 없이 동작하는지는 pthreads(7)의 futex 사용 서술과 futex(2)의 락 설명을 합친 것이고 glibc 소스는 읽지 않았다.
