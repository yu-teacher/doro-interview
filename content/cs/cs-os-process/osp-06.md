---
slug: "osp-06"
topic: "cs-os-process"
tier: BASIC
difficulty: 2
title: "뮤텍스와 세마포어는 어떻게 다르고 언제 각각 쓰나요?"
keywords: ["소유자가 있는 뮤텍스", "카운터 기반 세마포어", "다른 스레드가 post 가능", "동시 N개 허용", "신호 전달 용도"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://pubs.opengroup.org/onlinepubs/9799919799/basedefs/V1_chap03.html", "https://pubs.opengroup.org/onlinepubs/9799919799/functions/pthread_mutex_lock.html", "https://pubs.opengroup.org/onlinepubs/9799919799/functions/sem_wait.html", "https://pubs.opengroup.org/onlinepubs/9799919799/functions/sem_post.html", "https://man7.org/linux/man-pages/man7/sem_overview.7.html", "https://pages.cs.wisc.edu/~remzi/OSTEP/"]
refs: ["OSTEP, Semaphores (threads-sema), 31.1 Semaphores: A Definition, PDF p.2", "OSTEP, Semaphores (threads-sema), 31.2 Binary Semaphores (Locks), PDF p.3-4", "OSTEP, Semaphores (threads-sema), 31.3 Semaphores For Ordering, PDF p.4-5", "OSTEP, Semaphores (threads-sema), Tip: Setting The Value Of A Semaphore, PDF p.7", "OSTEP, Semaphores (threads-sema), 31.7 Thread Throttling, 31.8 How To Implement Semaphores, PDF p.16"]
concepts: [race-condition]
importance: 3
links: [{to: "osp-11", kind: FOLLOWUP}, {to: "osp-12", kind: FOLLOWUP}, {to: "jt-11", kind: RELATED}]
---
**모범 답변 (30~60초)**
뮤텍스는 임계 구역에 한 번에 한 스레드만 들어가게 하는 잠금이고, 잠근 스레드가 소유자라서 그 스레드만 풀 수 있습니다. 세마포어는 0 이상의 카운터를 가진 동기화 객체로, wait는 값을 줄이고 값이 0이면 기다리며 post는 값을 늘려 대기자를 깨웁니다. 소유자 개념이 없어서 다른 스레드가 post해도 되므로, 동시에 N개만 허용하는 자원 제한이나 한 스레드가 다른 스레드에게 이벤트를 알리는 신호 용도로 씁니다. 초깃값 1인 세마포어를 뮤텍스처럼 쓸 수는 있지만 소유자 검사가 없습니다.

(공식 문서) POSIX 정의 장(3.215)은 뮤텍스를 잠근 스레드가 소유자가 되어 같은 스레드가 풀 때까지 소유한다고 하고, pthread_mutex_lock 문서의 표는 소유자가 아닌 스레드의 unlock이 ERRORCHECK 타입에서는 오류, NORMAL(비 robust)에서는 정의되지 않은 동작이라고 한다. sem_overview(7)는 세마포어가 0 아래로 내려가지 않는 정수이고 값을 하나 늘리는 sem_post와 하나 줄이는 sem_wait로 조작되며 값이 0이면 sem_wait가 값이 0보다 커질 때까지 블록된다고 한다. sem_post 문서는 연산 결과 값이 0이 되면 블록된 스레드 하나가 sem_wait에서 돌아오게 한다고 한다.
(실험 확인) macOS 26.6.2(Darwin 25.6.0), Apple M5 Pro, Apple clang 21. ERRORCHECK 뮤텍스를 main이 잠근 뒤 다른 스레드가 unlock하자 EPERM(1)이 반환됐다. 다른 스레드가 sem_post하면 main의 sem_wait가 깨어났다. 초깃값 3인 카운팅 세마포어를 8개 스레드가 쓰는 동안 동시에 임계 구역 안에 있던 스레드는 최대 3개였다. 이 macOS에는 sem_init(이름 없는 세마포어)이 없어 이름 있는 세마포어(sem_open)로 실험했다.
(원저자 자료) OSTEP 세마포어 장(threads-sema)은 초깃값 1인 세마포어를 임계 구역 앞뒤의 wait/post 쌍으로 감싸면 락처럼 쓸 수 있고 이를 바이너리 세마포어라 부르며, 락은 쥔 상태와 아닌 상태 둘뿐이라 그렇게만 쓸 거면 더 단순하게 구현할 수도 있다고 설명한다. 값이 음수일 때 그 절댓값이 기다리는 스레드 수라는 다익스트라 정의의 불변식도 소개하되, 31.8절에서는 값이 0 아래로 내려가지 않는 구현이 더 쉽고 현재 리눅스 구현과 맞는다고 덧붙인다. 초깃값 0으로 두면 한 스레드가 어떤 일이 끝나기를 wait로 기다리고 다른 스레드(자식)가 post로 끝났음을 알리는 순서 지정(신호) 용도로 쓸 수 있다고 한다. 초깃값은 초기화 직후 바로 내줄 수 있는 자원의 개수로 정하면 된다고 정리하는데, 락은 1이고 순서 지정은 0이다. 31.7절은 세마포어를 동시에 코드 구간에 들어갈 수 있는 스레드 수의 상한(예: 메모리를 많이 쓰는 구간)으로 초기화하고 wait/post로 구간을 감싸면 스레드 수를 제한하는 스로틀링이 된다고 소개한다.
(보충) 세마포어에 소유자 개념이 없다는 서술은 OSTEP도 직접 하지 않는다(위 순서 지정 예에서 wait와 post를 서로 다른 스레드가 하는 것만 보인다).
