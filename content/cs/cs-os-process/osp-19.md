---
slug: "osp-19"
topic: "cs-os-process"
tier: TRICKY
difficulty: 3
title: "원자 연산과 메모리 순서(acquire/release)는 무엇이고, volatile로는 왜 충분하지 않나요?"
keywords: ["원자적 read-modify-write", "release 이전 쓰기가 acquire 후 보임", "mutex는 acquire/release", "relaxed는 동기화가 아님", "volatile은 동기화 수단이 아님"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://pubs.opengroup.org/onlinepubs/9799919799/basedefs/V1_chap04.html", "https://pubs.opengroup.org/onlinepubs/9799919799/basedefs/stdatomic.h.html", "https://www.kernel.org/doc/html/latest/core-api/wrappers/memory-barriers.html", "https://pubs.opengroup.org/onlinepubs/9799919799/basedefs/V1_chap03.html"]
concepts: [memory-model, race-condition]
importance: 1
links: [{to: "osp-05", kind: PREREQ}, {to: "jt-05", kind: RELATED}, {to: "jt-09", kind: RELATED}]
---
**모범 답변 (30~60초)**
원자 연산은 읽고 수정하고 쓰는 과정이 중간에 끼어들 수 없는 하나의 연산이라서, 락 없이 카운터를 안전하게 올릴 수 있습니다. 메모리 순서는 한 스레드의 쓰기가 다른 스레드에 어떤 순서로 보이는지를 정합니다. 한 스레드가 데이터를 쓰고 플래그를 release로 쓴 뒤 다른 스레드가 그 플래그를 acquire로 읽어 새 값을 보면, 앞서 쓴 데이터도 보입니다. 뮤텍스의 unlock과 lock이 바로 release와 acquire입니다. relaxed 원자 연산은 원자적이지만 이런 동기화는 아니고, volatile은 원자성을 주지 않으며 동기화 연산도 아니어서 스레드 간 동기화에 쓰면 안 됩니다.

(공식 문서) POSIX 정의 3.32는 원자 연산을 더 작은 부분으로 쪼개 따로 수행할 수 없고 완전히 끝나거나 전혀 일어나지 않는 연산으로 정의한다. POSIX 4.15.1은 원자 연산과 뮤텍스 연산이 acquire, release, 둘 다, consume 중 하나인 동기화 연산이며, 뮤텍스를 잠그는 호출은 acquire, 같은 뮤텍스를 푸는 호출은 release이고, A에 대한 release가 이후 A에 acquire하는 다른 스레드에게 앞선 부작용을 보이게 한다고 설명한다(이 뮤텍스 서술은 Note로 붙은 비형식 설명이다). relaxed 원자 연산은 동기화 연산이 아니지만 데이터 레이스를 일으키지는 않는다고 한다. stdatomic.h 문서는 atomic_flag 연산이 lock-free라고 한다. 커널 memory-barriers 문서는 ACQUIRE를 뒤의 메모리 연산이 앞으로 넘어오지 못하게 하는 한 방향 장벽, RELEASE를 앞의 연산이 뒤로 넘어가지 못하게 하는 한 방향 장벽으로 정의하고 LOCK은 ACQUIRE, UNLOCK은 RELEASE에 포함된다고 한다. 이 문서는 커널의 메모리 모델 설명이며, 같은 문서가 Itanium에서 커널의 READ_ONCE/WRITE_ONCE가 쓰는 volatile 캐스트가 GCC로 하여금 ld.acq/st.rel 명령을 내게 한다고 적듯이 volatile의 효과는 구현에 따라 다르다.
(실험 확인) macOS 26.6.2(Darwin 25.6.0), Apple M5 Pro, Apple clang 21. 스레드 4개가 각각 100만 번 증가시킬 때 volatile long 증가는 값이 유실됐고(osp-05) atomic_fetch_add는 매번 4,000,000이었다. 즉 volatile은 원자성을 주지 않았다. 메시지 패싱 리트머스(쓰기 쪽이 x=1 뒤 y=1, 읽기 쪽이 y를 읽은 뒤 x를 읽음, 매번 새 변수 200만 회)에서 y는 1인데 x는 0으로 보이는 결과는 relaxed 순서에서 8회 중 7회에 1~18번(회당) 관찰됐고, y를 release로 쓰고 acquire로 읽은 경우에는 8회 모두 0번이었다. 0번은 금지의 증명이 아니라 이 환경에서 관찰하지 못했다는 뜻이다.
(보충) volatile이 스레드 간 동기화 수단이 못 된다는 언어 규칙 서술은 위 문서들에 직접 없다. POSIX 4.15가 동기화 연산을 원자 연산과 뮤텍스 연산(과 fence)으로 열거하고 volatile을 언급하지 않는다는 점과 실험의 유실 결과에서 이끌어낸 일반 설명이다.
