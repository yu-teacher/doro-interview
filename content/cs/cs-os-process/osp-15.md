---
slug: "osp-15"
topic: "cs-os-process"
tier: DEEP
difficulty: 2
title: "멀티프로세스와 멀티스레드 중 무엇을 선택하나요?"
keywords: ["메모리와 장애 격리", "스레드 간 데이터 공유가 빠름", "생성·전환 비용", "공유 데이터 동기화 부담", "스레드 오류가 프로세스 전체에 영향"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://man7.org/linux/man-pages/man7/pthreads.7.html", "https://man7.org/linux/man-pages/man2/fork.2.html", "https://pubs.opengroup.org/onlinepubs/9799919799/functions/fork.html", "https://pages.cs.wisc.edu/~remzi/OSTEP/"]
refs: ["OSTEP, Concurrency: An Introduction (threads-intro), 26.1 Why Use Threads?, PDF p.3", "OSTEP, Concurrency: An Introduction (threads-intro), 도입부(스레드 전환과 스택), PDF p.1", "OSTEP, Concurrency: An Introduction (threads-intro), 26.4 Uncontrolled Scheduling, PDF p.9-10"]
concepts: [thread-process, process-management]
importance: 2
links: [{to: "osp-16", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
스레드는 주소 공간을 공유해서 생성과 전환이 가볍고 데이터를 메모리로 바로 공유할 수 있지만, 그 대가로 공유 데이터에 락이 필요하고 한 스레드의 메모리 오류가 프로세스 전체를 죽입니다. 프로세스는 메모리가 격리되어 하나가 죽어도 다른 프로세스는 영향을 받지 않고 권한도 따로 줄 수 있지만, 통신에 IPC가 필요하고 생성 비용이 큽니다. 그래서 같은 데이터를 빠르게 공유하며 협력하는 작업은 멀티스레드, 장애와 보안 경계를 나눠야 하거나 서로 독립적인 작업은 멀티프로세스를 고릅니다.

(공식 문서) pthreads(7)는 스레드가 전역 메모리를 공유하고 프로세스 ID, 열린 파일 디스크립터, 시그널 처분 같은 속성이 프로세스 전체 속성이라고 하고, fork(2)는 자식이 별도의 메모리 공간에서 실행되며 한쪽의 메모리 쓰기·매핑이 다른 쪽에 영향을 주지 않는다고 설명한다. POSIX fork는 자식이 호출 프로세스의 복사본이며 부모와 자식이 서로 독립적으로 실행될 수 있다고 한다.
(실험 확인) macOS 26.6.2(Darwin 25.6.0), Apple M5 Pro, Apple clang 21. 자식 프로세스가 널 포인터에 써서 SIGSEGV로 죽자 부모는 WIFSIGNALED와 시그널 번호 11을 확인하고 계속 실행됐다. 반면 스레드가 널 포인터에 쓰자 프로세스 전체가 SIGSEGV로 죽어(셸 종료 상태 139 = 128+11) main의 뒤따르는 출력이 나오지 않았다. 생성 비용은 osp-01 실험에서 fork+wait 약 376 µs, pthread_create+join 약 17 µs였다.
(원저자 자료) OSTEP 동시성 입문 장(threads-intro) 26.1절은 스레드를 쓰는 이유로 병렬화와 느린 I/O 때문에 진행이 막히는 것의 회피를 들고, 둘 다 프로세스로도 할 수 있지만 스레드는 주소 공간을 공유해 데이터를 나누기 쉬우므로 이런 작업에 자연스러운 선택이라고 한다. 메모리에서 자료 구조를 거의 공유할 필요가 없는 논리적으로 별개의 작업에는 프로세스가 더 합리적이라고 쓴다. 같은 장은 스레드 전환은 주소 공간을 바꾸지 않아 페이지 테이블을 교체할 필요가 없다는 점이 프로세스 전환과 다르다고 하고, 스레드가 공유 데이터를 동시에 갱신하면 경쟁 상태가 생기므로 락 같은 상호 배제가 필요하다고 설명한다.
(보충) 격리·보안 경계가 필요하면 프로세스를 고른다는 기준과 프로세스별로 권한을 따로 줄 수 있다는 서술, 통신에 IPC가 필요해 비용이 든다는 서술, 한 스레드의 메모리 오류가 프로세스 전체를 죽인다는 일반화(위 실험은 널 포인터 쓰기 한 경우)는 OSTEP이 이 자리에서 다루지 않는다.
