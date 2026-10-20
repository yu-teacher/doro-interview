---
slug: "osm-15"
topic: "cs-os-memory"
tier: DEEP
difficulty: 3
title: "select, poll, epoll은 어떻게 다르고, 연결이 많을 때 epoll이 유리한 이유는 무엇인가요?"
keywords: ["select의 FD_SETSIZE 한계", "매 호출마다 fd 집합 구성과 검사", "poll은 fd 배열 사용", "epoll은 관심 목록을 커널에 유지", "레벨·에지 트리거"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://pubs.opengroup.org/onlinepubs/9799919799/functions/select.html", "https://pubs.opengroup.org/onlinepubs/9799919799/functions/poll.html", "https://man7.org/linux/man-pages/man2/select.2.html", "https://man7.org/linux/man-pages/man7/epoll.7.html"]
---
**모범 답변 (30~60초)**
`select`는 fd를 고정 크기 비트 집합으로 넘기는 방식이라 fd 번호가 `FD_SETSIZE`(glibc에서 1024) 이상이면 쓸 수 없고, 호출마다 집합을 다시 만들어 넘겨야 하며 검사해야 할 범위(`nfds`)가 커질수록 작업량도 늘어납니다. `poll`은 fd를 구조체 배열로 넘겨서 번호 한도는 없지만 여전히 호출마다 전체 목록을 넘깁니다. `epoll`은 관심 있는 fd 목록을 커널 안에 두고 한 번 등록해 둔 뒤, 준비된 목록만 `epoll_wait`로 꺼내 오는 방식이라 감시 대상이 많을 때 확장성이 좋습니다. 레벨 트리거와 에지 트리거를 모두 지원하는데, 에지 트리거는 논블로킹 fd와 함께 `EAGAIN`이 날 때까지 읽는 식으로 써야 합니다.

(공식 문서) POSIX `select`(APPLICATION USAGE)는 fd 집합을 폴링 루프를 돌 때마다 다시 구성해야 하고 `FD_SETSIZE`보다 큰 fd에는 쓸 수 없으며, 선택한 fd 수가 같아도 `nfds`가 커지면 작업량이 늘어나므로 `poll`을 고려하라고 권한다. `select(2)`는 `select()`가 `FD_SETSIZE`(1024)보다 작은 fd만 감시할 수 있고, `fd_set`이 고정 크기 버퍼이며 이를 넘는 fd로 `FD_SET`을 하면 정의되지 않은 동작이라고 한다. 또 BUGS 절은 Linux 커널 자체에는 고정 한도가 없고 glibc가 `fd_set`을 고정 크기로 만들어 `FD_SETSIZE`를 1024로 정한 것이며, 1023보다 큰 fd에는 `poll`이나 `epoll`을 쓰라고 한다. POSIX `poll`은 fd를 `pollfd` 구조체 배열로 넘기게 한다. `epoll(7)`은 epoll 인스턴스가 관심 목록(interest list)과 준비 목록(ready list)을 갖고, `epoll_ctl`로 등록하고 `epoll_wait`가 준비 목록에서 꺼내며, 많은 fd에서 확장성이 좋고 레벨·에지 트리거를 모두 지원한다고 한다. 에지 트리거는 논블로킹 fd를 쓰고 `read`/`write`가 `EAGAIN`을 돌려준 뒤에 이벤트를 기다리라고 권한다.
(실험 확인) macOS에서 파이썬으로 fd 번호가 1024 이상인 소켓을 `select`에 넣으니 파이썬이 "filedescriptor out of range in select()" 오류(ValueError)를 냈고, 같은 fd를 `poll`에는 문제없이 넣을 수 있었다(오류를 낸 것은 파이썬이며 운영체제의 `select` 결과를 직접 본 것은 아니다). 준비된 fd가 1개뿐일 때 `poll(0)` 한 번의 비용은 등록 fd가 10개일 때 약 1.4us, 100개 11us, 1,000개 121us, 3,000개 381us로 fd 수에 거의 비례해 커졌다. macOS에는 `epoll`이 없어(`kqueue` 제공) `epoll`은 실행해 확인하지 못했다. `epoll`의 확장성은 공식 문서의 설명이며 측정으로 확인한 것이 아니다.
