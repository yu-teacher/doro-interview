---
slug: "osp-14"
topic: "cs-os-process"
tier: DEEP
difficulty: 3
title: "데드락을 예방·회피·탐지하는 방법은 무엇이고 실무에서는 어떻게 하나요?"
keywords: ["락 획득 순서 고정", "은행원 알고리즘 안전 상태", "trylock·타임아웃", "탐지 후 복구", "lockdep 락 순서 검증"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://www.kernel.org/doc/html/latest/locking/lockdep-design.html", "https://www.kernel.org/doc/html/latest/locking/mutex-design.html", "https://pubs.opengroup.org/onlinepubs/9799919799/functions/pthread_mutex_lock.html", "https://pages.cs.wisc.edu/~remzi/OSTEP/"]
refs: ["OSTEP, Common Concurrency Problems (threads-bugs), 32.3 Deadlock Bugs(예방), PDF p.6-10", "OSTEP, Common Concurrency Problems (threads-bugs), Deadlock Avoidance via Scheduling, PDF p.12-13", "OSTEP, Common Concurrency Problems (threads-bugs), Detect and Recover, PDF p.13-14", "OSTEP, Common Concurrency Problems (threads-bugs), 32.4 Summary, PDF p.14"]
concepts: [deadlock]
importance: 2
links: [{to: "dbl-11", kind: RELATED}]
---
**모범 답변 (30~60초)**
예방은 데드락 조건 중 하나를 구조적으로 깨는 것이고, 모든 스레드가 락을 같은 순서로 잡도록 정해 순환 대기를 없애는 방법이 대표적입니다. 회피는 자원 요청을 허락하기 전에 허락한 결과가 안전 상태인지 확인하는 방식으로 은행원 알고리즘이 대표적인데, 프로세스의 최대 요구량을 미리 알아야 해서 범용 시스템에서는 잘 쓰지 않습니다. 탐지는 대기 그래프에서 사이클을 찾아 프로세스를 종료하거나 자원을 회수하는 것입니다. 코드에서는 trylock이 실패하면 가진 락을 풀고 다시 시도하거나 타임아웃을 두기도 합니다. 리눅스 커널은 lockdep으로 락 순서 위반을 검증합니다.

(공식 문서) 커널 lockdep 문서는 락 사이의 의존 순서에서 L1→L2와 L2→L1이 모두 나타나면 원형 대기를 이루는 lock inversion deadlock이 될 수 있어 허용하지 않고, 검증기가 임의 복잡도의 의존 사이클을 찾아내며 그 시나리오가 실제로 일어나지 않았더라도 가능성을 보고한다고 설명한다. 커널 mutex 문서는 mutex 디버깅 코드(CONFIG_DEBUG_MUTEXES)가 자기 재귀 락과 여러 태스크의 원형 데드락을 탐지해 관련 락과 태스크를 출력한다고 한다. POSIX pthread_mutex_lock 문서는 ERRORCHECK 뮤텍스의 재잠금을 오류로 반환하고 trylock이 이미 잠겨 있으면 EBUSY로 실패한다고 한다.
(실험 확인) macOS 26.6.2(Darwin 25.6.0), Apple M5 Pro, Apple clang 21. 두 스레드가 A→B, B→A로 잡으면 교착했고 둘 다 A→B로 고정하면 종료했다(osp-07과 같은 실험). 파이썬으로 은행원 알고리즘의 안전 상태 검사를 구현해 교과서형 예시(프로세스 5개, 자원 종류 3개)를 돌리자 안전 상태였고 안전 순서 P1, P3, P0, P2, P4가 나왔다. 자원 한 종류 총 10개를 프로세스 3개가 3개씩 쥐고 각각 최대 9개까지 요구할 수 있으며 가용이 1개인 상태는 불안전으로 판정됐다.
(원저자 자료) OSTEP 일반적 동시성 버그 장(threads-bugs)은 데드락 대응을 예방, 회피, 탐지 후 복구로 나누어 다룬다. 예방은 네 조건 중 하나를 막는 것인데, 락 획득에 전체(또는 부분) 순서를 두어 순환 대기를 막는 방법이 가장 실용적이라고 한다. 모든 락을 한 번에 얻는 보호 락으로 점유와 대기를 막을 수도 있지만 동시성이 떨어진다고 한다. `pthread_mutex_trylock`으로 하나라도 실패하면 쥔 락을 풀고 처음부터 다시 시도하는 방식도 소개하며, 이때 두 스레드가 계속 서로 방해하며 진행하지 못하는 라이브락이 생길 수 있고 재시도 전에 무작위 지연을 두면 줄일 수 있다고 한다. 회피는 어떤 스레드가 어떤 락을 쓰는지 전역 지식이 필요한 스케줄링으로, 대표 예가 다익스트라의 은행원 알고리즘이지만 모든 작업과 필요한 락을 아는 임베디드 같은 제한된 환경에서만 쓸모 있고 동시성을 해쳐 범용 해법이 아니라고 한다. 탐지 후 복구는 데드락이 드물게 생기도록 놓아두고, 주기적으로 자원 그래프를 만들어 사이클을 찾으면 시스템을 재시작하며 필요하면 사람이 개입하는 방식으로, 많은 데이터베이스가 쓴다고 한다. 책은 실무의 가장 좋은 해법으로 락 획득 순서를 정해 두어 처음부터 데드락을 막는 것을 꼽는다.
(보충) 은행원 알고리즘이 안전 상태인지 검사해 요청을 허락한다는 세부 동작(책은 이름과 적용 한계만 적는다)과 trylock 실패 때 타임아웃을 두는 방식은 OSTEP에 없다.
