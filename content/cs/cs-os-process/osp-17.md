---
slug: "osp-17"
topic: "cs-os-process"
tier: TRICKY
difficulty: 3
title: "같은 시그널이 여러 번 오면 모두 전달되나요? 멀티스레드에서는 어느 스레드가 받나요?"
keywords: ["표준 시그널은 큐잉되지 않음", "대기 중 시그널 합쳐짐", "실시간 시그널은 큐잉", "프로세스 대상 시그널은 임의 스레드", "SIGKILL·SIGSTOP은 잡을 수 없음"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://man7.org/linux/man-pages/man7/signal.7.html", "https://pubs.opengroup.org/onlinepubs/9799919799/functions/sigaction.html"]
concepts: [process-management]
importance: 1
---
**모범 답변 (30~60초)**
표준 시그널은 큐에 쌓이지 않습니다. 같은 시그널이 블록된 동안 여러 번 와도 대기 상태는 한 번만 표시되어 핸들러가 한 번만 실행되므로, 시그널 횟수에 의존하면 안 됩니다. 반면 리눅스의 실시간 시그널은 여러 개가 큐에 쌓이고 sigqueue로 값을 함께 보낼 수 있습니다. 멀티스레드에서 kill로 프로세스에 보낸 시그널은 그 시그널을 블록하지 않은 스레드 중 임의의 하나가 받고, SIGSEGV처럼 특정 명령 때문에 생긴 시그널은 그 스레드가 받습니다. 그리고 SIGKILL과 SIGSTOP은 잡거나 블록하거나 무시할 수 없습니다.

(공식 문서) signal(7)은 표준 시그널이 큐에 쌓이지 않아 블록된 동안 같은 시그널이 여러 번 생성돼도 한 번만 대기 표시되고 전달도 한 번이라고 한다. 실시간 시그널(Linux 2.2 이후)은 여러 인스턴스가 큐에 쌓이고 sigqueue로 값을 보낼 수 있으며 같은 종류는 전달 순서가 보장된다고 하고, 큐에 쌓을 수 있는 수는 Linux 2.6.8부터 사용자별 RLIMIT_SIGPENDING 한도로 제한된다고 한다. 스레드마다 독립된 시그널 마스크가 있고, 프로세스 대상 시그널(kill 등)은 해당 시그널을 블록하지 않은 스레드 중 커널이 임의로 고른 하나에 전달되며, 하드웨어 예외로 생긴 SIGSEGV 등과 tgkill·pthread_kill로 보낸 시그널은 특정 스레드 대상이라고 한다. SIGKILL과 SIGSTOP은 잡거나 블록하거나 무시할 수 없다고 하고, POSIX sigaction은 잡을 수 없는 시그널을 잡으려는 시도가 EINVAL로 실패한다고 한다.
(실험 확인) macOS 26.6.2(Darwin 25.6.0), Apple M5 Pro, Apple clang 21. SIGUSR1을 블록한 상태에서 자기 자신에게 5번 kill한 뒤 블록을 풀자 핸들러는 1번만 실행됐다. SIGKILL과 SIGSTOP에 핸들러를 등록하려는 sigaction은 -1과 EINVAL로 실패했다. 스레드를 하나 더 만들고 main 스레드만 pthread_sigmask로 SIGUSR1을 블록한 뒤 kill(getpid(), SIGUSR1)을 보내자 3회 모두 블록하지 않은 다른 스레드에서 핸들러가 실행됐다. 실시간 시그널은 이 환경에서 실험하지 않았다.
