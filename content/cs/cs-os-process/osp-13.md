---
slug: "osp-13"
topic: "cs-os-process"
tier: DEEP
difficulty: 2
title: "프로세스 간 통신(IPC) 방식에는 무엇이 있고 어떤 기준으로 고르나요?"
keywords: ["파이프는 바이트 스트림", "UNIX 도메인 소켓", "공유 메모리는 별도 동기화 필요", "메시지 큐 우선순위", "시그널은 알림용"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://pubs.opengroup.org/onlinepubs/9799919799/functions/pipe.html", "https://man7.org/linux/man-pages/man7/pipe.7.html", "https://man7.org/linux/man-pages/man7/unix.7.html", "https://man7.org/linux/man-pages/man7/shm_overview.7.html", "https://man7.org/linux/man-pages/man7/mq_overview.7.html", "https://pubs.opengroup.org/onlinepubs/9799919799/functions/mmap.html", "https://pubs.opengroup.org/onlinepubs/9799919799/functions/shm_open.html", "https://man7.org/linux/man-pages/man7/signal.7.html"]
---
**모범 답변 (30~60초)**
파이프는 관련 있는 프로세스 사이의 단방향 바이트 스트림이고, 이름이 있는 FIFO는 관련 없는 프로세스도 쓸 수 있습니다. 같은 머신의 UNIX 도메인 소켓은 양방향 통신이 되고 메시지 경계를 유지하는 타입도 고를 수 있습니다. 공유 메모리는 같은 메모리를 매핑해 쓰므로 데이터를 복사해 주고받지 않아도 되지만 접근 동기화를 직접 해야 합니다. 메시지 큐는 우선순위가 있는 메시지 단위로 주고받고, 시그널은 이벤트를 알리는 용도라 큰 데이터를 보내기엔 맞지 않습니다. 단순한 스트림이면 파이프, 양방향 요청 응답이면 소켓, 대량 데이터 공유면 공유 메모리를 먼저 고려합니다.

(공식 문서) pipe(7)는 파이프와 FIFO가 단방향 통신 채널이고 파이프는 관련 프로세스 사이에 쓸 수 있으며 FIFO는 파일시스템에 이름이 있어 어떤 프로세스든 열 수 있다고 한다. 파이프는 바이트 스트림이고 메시지 경계가 없으며 용량이 한정되어 모든 쓰기 끝이 닫히면 읽기가 EOF(0)를 보고, 읽기 끝이 모두 닫힌 뒤 쓰면 SIGPIPE가 생기거나 EPIPE로 실패한다고 한다. 파이프와 FIFO의 차이는 만들고 여는 방식뿐이다. POSIX pipe는 읽기 끝이 쓰기에도 열려 있는지를 규정하지 않으므로 단방향은 리눅스 pipe(7)의 서술이다. unix(7)는 UNIX 도메인 소켓이 같은 머신의 프로세스 간 통신용이고 SOCK_STREAM은 스트림, SOCK_DGRAM과 SOCK_SEQPACKET은 메시지 경계를 유지하며 파일 디스크립터나 자격 증명을 전달할 수 있다고 한다. shm_overview(7)는 POSIX 공유 메모리를 shm_open, ftruncate, mmap으로 쓰고 프로세스들이 보통 세마포어 등으로 접근을 동기화해야 한다고 하며, POSIX mmap은 MAP_SHARED 쓰기가 대상 객체를 바꾸고 매핑 유형이 fork 후에도 유지된다고 한다. mq_overview(7)는 메시지마다 우선순위가 있어 항상 높은 우선순위부터 전달된다고 한다. signal(7)은 표준 시그널이 큐에 쌓이지 않으며 값을 함께 보낼 수 있는 것은 sigqueue로 보내는 실시간 시그널이라고 한다.
(실험 확인) macOS 26.6.2(Darwin 25.6.0), Apple M5 Pro, Apple clang 21. 파이프에 3바이트와 5바이트를 연달아 쓰고 읽으면 read 한 번에 8바이트가 왔고, 쓰기 끝을 모두 닫자 read가 0을 반환했다. 읽는 쪽이 없는 파이프에 쓰면(SIGPIPE를 무시한 상태) -1과 EPIPE가 나왔고, 비차단 쓰기가 EAGAIN이 날 때까지 쓴 파이프 용량은 65536바이트였다. 읽기 끝(fd[0])에 쓰면 EBADF로 실패했다. AF_UNIX SOCK_DGRAM에서는 같은 두 번의 쓰기가 3바이트와 5바이트로 나뉘어 읽혔고 SOCK_STREAM에서는 8바이트가 한 번에 읽혔으며 socketpair는 두 방향 모두 쓸 수 있었다. 익명 MAP_SHARED와 MAP_PRIVATE 메모리를 fork한 뒤 자식이 각각 2를 쓰자 부모에서 MAP_SHARED는 2, MAP_PRIVATE는 1로 보였다. 이 환경에서 POSIX 메시지 큐는 실험하지 않았다.
(보충) UNIX 도메인 소켓이 양방향이라는 서술은 위 문서에 직접 없고 socketpair 실험(macOS)으로만 확인했다. 공유 메모리가 복사를 줄인다는 설명, 시그널이 큰 데이터 전달에 맞지 않는다는 설명, 어떤 상황에서 어느 방식을 먼저 고려할지는 일반적인 선택 요령이다.
