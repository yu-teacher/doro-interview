---
slug: "osm-14"
topic: "cs-os-memory"
tier: DEEP
difficulty: 2
title: "블로킹, 논블로킹, I/O 멀티플렉싱, 비동기 I/O는 각각 무엇이 다른가요?"
keywords: ["블로킹은 준비될 때까지 대기", "논블로킹은 EAGAIN으로 즉시 반환", "멀티플렉싱은 여러 fd의 준비 상태 대기", "준비 통지와 완료 통지", "POSIX AIO·io_uring"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://pubs.opengroup.org/onlinepubs/9799919799/functions/read.html", "https://pubs.opengroup.org/onlinepubs/9799919799/functions/select.html", "https://pubs.opengroup.org/onlinepubs/9799919799/functions/poll.html", "https://man7.org/linux/man-pages/man2/open.2.html", "https://man7.org/linux/man-pages/man7/aio.7.html", "https://man7.org/linux/man-pages/man7/io_uring.7.html"]
concepts: [io-filesystem]
importance: 3
links: [{to: "osm-15", kind: FOLLOWUP}, {to: "jt-15", kind: RELATED}]
---
**모범 답변 (30~60초)**
블로킹 I/O는 `read`를 호출한 스레드가 데이터가 올 때까지 멈춰서 기다리는 방식입니다. 논블로킹은 `O_NONBLOCK`을 켜서 데이터가 없으면 기다리지 않고 `EAGAIN`으로 바로 돌아오게 하는 방식이라 직접 반복해서 확인해야 합니다. I/O 멀티플렉싱은 `select`, `poll`, `epoll`로 여러 파일 디스크립터 중 준비된 것이 생길 때까지 한 곳에서 기다리고, 준비된 것만 읽습니다. 여기까지는 준비됐다는 통지를 받는 모델이고, 비동기 I/O는 요청을 미리 제출하고 작업이 끝났다는 통지를 받는 모델로 POSIX AIO나 Linux의 io_uring이 해당합니다.

(공식 문서) POSIX `read`는 쓰는 쪽이 열려 있는 파이프에 데이터가 없을 때 `O_NONBLOCK`이 켜져 있으면 -1과 `EAGAIN`을, 꺼져 있으면 데이터가 올 때까지 블록한다고 한다. POSIX `select`는 읽기 준비를 `O_NONBLOCK`이 꺼진 입력 호출이 블록되지 않을 상태로 정의한다. POSIX AIO는 `aio_read`처럼 요청을 큐에 넣고 시그널·스레드·무통지 중 하나로 완료를 알리며(`aio(7)`), io_uring은 Linux 전용으로 제출 큐와 완료 큐 링 버퍼를 사용자·커널이 공유해 요청을 비동기로 처리한다(`io_uring(7)`). `open(2)`는 `O_NONBLOCK`이 일반 파일과 블록 장치에는 효과가 없고, `poll`·`select`·`epoll` 같은 인터페이스는 fd가 "준비"됐는지, 곧 `O_NONBLOCK`이 꺼진 I/O가 블록되지 않을지를 알려 줄 뿐이라고 한다.
(실험 확인) macOS에서 파이썬으로 빈 파이프에 `O_NONBLOCK`을 켜고 `read`하자 `EAGAIN`이 나왔고, 블로킹 모드에서는 0.3초 뒤 쓰기가 일어날 때까지 약 0.3초 기다렸다. 소켓쌍 100개 중 1개만 데이터를 보냈을 때 `select`와 `poll`은 준비된 1개만 돌려주었다.
