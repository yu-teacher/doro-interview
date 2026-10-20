---
slug: "osp-16"
topic: "cs-os-process"
tier: TRICKY
difficulty: 3
title: "멀티스레드 프로그램에서 fork()를 호출하면 왜 위험한가요?"
keywords: ["호출한 스레드만 복제", "mutex 상태까지 복제", "async-signal-safe 함수만 호출", "fork 직후 exec", "pthread_atfork"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://pubs.opengroup.org/onlinepubs/9799919799/functions/fork.html", "https://man7.org/linux/man-pages/man2/fork.2.html"]
---
**모범 답변 (30~60초)**
fork된 자식에는 fork를 호출한 스레드 하나만 존재하고 다른 스레드는 없지만, 주소 공간은 통째로 복제되어 리눅스에서는 뮤텍스와 조건 변수 상태까지 그대로 따라옵니다. 부모의 다른 스레드가 락을 쥔 채 fork가 일어나면 자식에는 그 락을 풀어 줄 스레드가 없어서, 자식이 그 락을 잡으면 영원히 멈출 수 있습니다. POSIX는 이런 락에 대한 자식의 동작을 정의되지 않은 동작으로 두고, 자식이 exec에 성공하기 전에는 async-signal-safe 연산만 실행하라고 규정합니다. 그래서 fork 직후 곧바로 exec하는 편이 안전하고, pthread_atfork 핸들러가 도움이 될 수 있습니다.

(공식 문서) POSIX fork는 프로세스가 단일 스레드로 생성되며 멀티스레드 프로세스가 fork하면 새 프로세스가 호출 스레드의 복제본과 뮤텍스 같은 자원의 상태를 포함할 수 있는 전체 주소 공간을 갖는다고 하고, 자식은 exec가 성공할 때까지 async-signal-safe 연산만 실행해야 한다고 한다. 프로세스 공유가 아닌 락에 대한 자식의 어떤 연산도 정의되지 않은 동작이라고 하며, 자식에 없는 다른 스레드의 스택·스레드 로컬 저장소를 가리키는 포인터를 쓰지 말라고도 한다. fork(2)는 자식이 단일 스레드이며 뮤텍스·조건 변수 등 pthreads 객체의 상태까지 복제되고, 멀티스레드에서 fork한 자식은 execve를 부르기 전까지 async-signal-safe 함수만 안전하게 호출할 수 있으며 pthread_atfork가 이 문제를 다루는 데 도움이 될 수 있다고 한다.
(실험 확인) macOS 26.6.2(Darwin 25.6.0), Apple M5 Pro, Apple clang 21. 다른 스레드가 뮤텍스를 쥔 채(30초 sleep) main이 fork하고, 자식이 같은 뮤텍스를 lock하게 하자 자식은 얻지 못했고 2초 alarm이 보낸 SIGALRM(14)에 죽었다. 대조로 락을 쥔 스레드가 없는 상태에서 fork하면 자식이 바로 락을 얻었다. 이 동작은 POSIX에서 정의되지 않은 동작이므로 다른 구현에서는 다르게 나타날 수 있다.
(보충) 락을 쥔 스레드가 없는 자식이 그 락을 잡으면 영원히 멈출 수 있다는 구체적 결과는 문서가 아니라 위 실험(macOS)에서 본 것이고 POSIX는 정의되지 않은 동작이라고만 한다. fork 직후 곧바로 exec하는 편이 안전하다는 권고는 exec 성공 전에는 async-signal-safe 연산만 허용한다는 규정에서 이끌어낸 일반 설명이다.
