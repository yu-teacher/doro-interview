---
slug: "osp-01"
topic: "cs-os-process"
tier: BASIC
difficulty: 1
title: "프로세스와 스레드는 무엇이 다르고, 무엇을 공유하나요?"
keywords: ["독립된 주소 공간", "전역 변수·힙 공유", "스레드별 스택", "열린 파일 디스크립터 공유", "생성 비용"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://man7.org/linux/man-pages/man7/pthreads.7.html", "https://pubs.opengroup.org/onlinepubs/9799919799/functions/fork.html", "https://pubs.opengroup.org/onlinepubs/9799919799/functions/pthread_create.html", "https://pubs.opengroup.org/onlinepubs/9799919799/basedefs/V1_chap03.html", "https://man7.org/linux/man-pages/man2/fork.2.html"]
---
**모범 답변 (30~60초)**
프로세스는 독립된 주소 공간과 그 실행에 필요한 자원을 묶은 단위이고, 스레드는 그 프로세스 안에서 실행되는 하나의 제어 흐름입니다. 같은 프로세스의 스레드들은 전역 변수와 힙, 열린 파일 디스크립터, 프로세스 ID를 공유하고, 스택과 스레드 ID, 시그널 마스크, errno는 스레드마다 따로 가집니다. 그래서 스레드끼리는 메모리로 바로 데이터를 주고받지만 동기화가 필요하고, 프로세스끼리는 메모리가 격리되어 IPC가 필요합니다. 생성 비용도 보통 스레드가 훨씬 작습니다.

(공식 문서) POSIX 정의 장은 live process(3.189)를 하나 이상의 스레드가 실행되는 주소 공간과 그 스레드에 필요한 자원으로, live thread(3.190)를 프로세스 안의 단일 제어 흐름으로 정의한다. 3.190은 스레드마다 스레드 ID, 스케줄링 우선순위·정책, errno 값을 따로 갖고, 정적 변수·malloc 저장소·자동 변수도 주소를 알아낼 수 있으면 같은 프로세스의 모든 스레드가 접근할 수 있다고 한다. 즉 스택이 스레드별로 따로 있어도 다른 스레드가 접근할 수 없다는 뜻은 아니다. pthreads(7)는 스레드가 전역 메모리(데이터·힙 세그먼트)를 공유하고 각자 스택을 가지며, POSIX.1이 프로세스 ID, 부모 프로세스 ID, 열린 파일 디스크립터, 시그널 처분 등을 프로세스 전체 속성으로, 스레드 ID, 시그널 마스크, errno, 실시간 스케줄링 정책·우선순위를 스레드별 속성으로 요구한다고 열거한다. 3.214는 멀티스레드 프로그램이 처음에는 단일 스레드 프로세스로 시작해 pthread_create로 스레드를 추가한다고 하고, POSIX fork 문서와 fork(2)는 자식이 부모 주소 공간의 복사본에서 별도로 실행된다고 한다.
(실험 확인) macOS 26.6.2(Darwin 25.6.0), Apple M5 Pro, Apple clang 21. 같은 프로세스에서 스레드가 전역 변수를 100으로 바꾸면 join 뒤 main에서 100으로 보였고, 두 스레드의 지역 변수 주소는 서로 달랐다(스택 분리). fork한 자식이 200으로 바꾼 값은 부모에서 보이지 않았다(1 그대로). fork 전에 연 파일을 자식이 4바이트 읽자 부모의 파일 오프셋도 4가 되어 열린 파일 서술을 공유함을 확인했다. fork+wait 2000회 평균은 약 376 µs, pthread_create+join 2000회 평균은 약 17 µs였다. 절댓값은 이 환경에서만 의미가 있다.
(보충) 스레드끼리는 메모리로 바로 주고받아 빠르지만 동기화가 필요하고 프로세스끼리는 IPC가 필요하다는 서술과, 생성 비용이 보통 스레드 쪽이 훨씬 작다는 일반화는 일반 설명이다. pthreads(7)는 NPTL이 LinuxThreads보다 스레드를 많이 만들 때 성능이 낫다고만 적고 프로세스와 비교하지 않는다. 위 생성 시간은 macOS 한 환경의 측정값이다.
