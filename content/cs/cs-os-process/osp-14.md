---
slug: "osp-14"
topic: "cs-os-process"
tier: DEEP
difficulty: 3
title: "데드락을 예방·회피·탐지하는 방법은 무엇이고 실무에서는 어떻게 하나요?"
keywords: ["락 획득 순서 고정", "은행원 알고리즘 안전 상태", "trylock·타임아웃", "탐지 후 복구", "lockdep 락 순서 검증"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.kernel.org/doc/html/latest/locking/lockdep-design.html", "https://www.kernel.org/doc/html/latest/locking/mutex-design.html", "https://pubs.opengroup.org/onlinepubs/9799919799/functions/pthread_mutex_lock.html"]
concepts: [deadlock]
importance: 2
links: [{to: "dbl-11", kind: RELATED}]
---
**모범 답변 (30~60초)**
예방은 데드락 조건 중 하나를 구조적으로 깨는 것이고, 모든 스레드가 락을 같은 순서로 잡도록 정해 순환 대기를 없애는 방법이 대표적입니다. 회피는 자원 요청을 허락하기 전에 허락한 결과가 안전 상태인지 확인하는 방식으로 은행원 알고리즘이 대표적인데, 프로세스의 최대 요구량을 미리 알아야 해서 범용 시스템에서는 잘 쓰지 않습니다. 탐지는 대기 그래프에서 사이클을 찾아 프로세스를 종료하거나 자원을 회수하는 것입니다. 코드에서는 trylock이 실패하면 가진 락을 풀고 다시 시도하거나 타임아웃을 두기도 합니다. 리눅스 커널은 lockdep으로 락 순서 위반을 검증합니다.

(공식 문서) 커널 lockdep 문서는 락 사이의 의존 순서에서 L1→L2와 L2→L1이 모두 나타나면 원형 대기를 이루는 lock inversion deadlock이 될 수 있어 허용하지 않고, 검증기가 임의 복잡도의 의존 사이클을 찾아내며 그 시나리오가 실제로 일어나지 않았더라도 가능성을 보고한다고 설명한다. 커널 mutex 문서는 mutex 디버깅 코드(CONFIG_DEBUG_MUTEXES)가 자기 재귀 락과 여러 태스크의 원형 데드락을 탐지해 관련 락과 태스크를 출력한다고 한다. POSIX pthread_mutex_lock 문서는 ERRORCHECK 뮤텍스의 재잠금을 오류로 반환하고 trylock이 이미 잠겨 있으면 EBUSY로 실패한다고 한다.
(실험 확인) macOS 26.6.2(Darwin 25.6.0), Apple M5 Pro, Apple clang 21. 두 스레드가 A→B, B→A로 잡으면 교착했고 둘 다 A→B로 고정하면 종료했다(osp-07과 같은 실험). 파이썬으로 은행원 알고리즘의 안전 상태 검사를 구현해 교과서형 예시(프로세스 5개, 자원 종류 3개)를 돌리자 안전 상태였고 안전 순서 P1, P3, P0, P2, P4가 나왔다. 자원 한 종류 총 10개를 프로세스 3개가 3개씩 쥐고 각각 최대 9개까지 요구할 수 있으며 가용이 1개인 상태는 불안전으로 판정됐다.
(보충) 예방·회피·탐지·복구의 분류, 은행원 알고리즘, 대기 그래프, 실무에서 락 순서를 정해 쓴다는 서술, trylock 후 물러나 재시도하거나 타임아웃을 두는 방식은 교과서와 실무의 일반 설명이다. 물러나 재시도할 때 서로 계속 양보만 하는 라이브락이 생길 수 있다.
