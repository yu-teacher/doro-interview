---
slug: "osp-07"
topic: "cs-os-process"
tier: BASIC
difficulty: 2
title: "데드락이 발생하는 네 가지 조건은 무엇인가요?"
keywords: ["상호 배제", "점유와 대기", "비선점", "순환 대기", "하나라도 깨면 예방"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://www.kernel.org/doc/html/latest/locking/lockdep-design.html", "https://pubs.opengroup.org/onlinepubs/9799919799/functions/pthread_mutex_lock.html", "https://pages.cs.wisc.edu/~remzi/OSTEP/"]
refs: ["OSTEP, Common Concurrency Problems (threads-bugs), 32.3 Deadlock Bugs, PDF p.5-6", "OSTEP, Common Concurrency Problems (threads-bugs), Conditions for Deadlock, PDF p.7", "OSTEP, Common Concurrency Problems (threads-bugs), Prevention: Circular Wait, PDF p.7-8"]
concepts: [deadlock]
importance: 3
links: [{to: "osp-14", kind: FOLLOWUP}, {to: "jt-12", kind: RELATED}, {to: "dbl-05", kind: RELATED}]
---
**모범 답변 (30~60초)**
데드락은 둘 이상의 흐름이 서로가 쥔 자원을 기다리느라 영원히 진행하지 못하는 상태입니다. 보통 네 조건이 동시에 성립할 때 생긴다고 설명합니다. 자원을 한 번에 한 흐름만 쓰는 상호 배제, 자원을 쥔 채 다른 자원을 기다리는 점유와 대기, 쥔 자원을 강제로 빼앗을 수 없는 비선점, 서로 상대가 가진 자원을 기다리는 원형 사슬인 순환 대기입니다. 하나라도 깨면 데드락을 예방할 수 있어서, 락을 항상 같은 순서로 잡아 순환 대기를 깨는 방법이 흔히 쓰입니다.

(공식 문서) 네 조건이라는 분류는 읽은 공식 출처에 없다. 다만 리눅스 커널 lockdep 문서는 두 락을 서로 반대 순서(L1→L2와 L2→L1)로 잡으면 두 문맥이 영원히 서로를 기다리는 원을 이루는 lock inversion deadlock이 되고, 같은 락 클래스를 두 번 잡는 것은 lock recursion deadlock이 될 수 있다고 설명한다. POSIX pthread_mutex_lock 문서의 표는 NORMAL 타입 뮤텍스를 소유 스레드가 다시 잠그면 deadlock이고 ERRORCHECK 타입이면 오류가 반환된다고 한다.
(실험 확인) macOS 26.6.2(Darwin 25.6.0), Apple M5 Pro, Apple clang 21. 스레드 1이 A→B, 스레드 2가 B→A 순서로 뮤텍스를 잡고 그 사이에 0.1초 쉬게 하자 3초 제한 안에 끝나지 않았다(교착, 종료 상태 142 = SIGALRM). 둘 다 A→B 순서로 바꾸면 정상 종료했다. ERRORCHECK 뮤텍스를 같은 스레드가 두 번 잠그면 EDEADLK(11)가 반환됐다.
(원저자 자료) OSTEP 일반적 동시성 버그 장(threads-bugs) 32.3절은 데드락을 한 스레드가 락 L1을 쥔 채 L2를 기다리는데 L2를 쥔 스레드가 L1을 기다리는 상태로 설명하고, 의존 그래프에 사이클이 있으면 데드락이라고 한다. 데드락이 생기려면 상호 배제(자원을 독점), 점유와 대기(자원을 쥔 채 추가 자원을 기다림), 비선점(쥔 자원을 강제로 빼앗을 수 없음), 순환 대기(각 스레드가 쥔 자원을 다음 스레드가 요구하는 원형 사슬)의 네 조건이 모두 성립해야 하고 하나라도 깨지면 데드락이 생기지 않는다고 쓴다. 예방은 이 조건 중 하나가 생기지 않게 하는 전략이며, 가장 실용적이고 흔히 쓰이는 방법으로 락 획득에 전체 순서를 두어 순환 대기를 없애는 것을 꼽는다. 순서는 관례일 뿐이라 어기면 데드락이 날 수 있다고도 덧붙인다. 이 순서 고정이 순환 대기를 깬다는 점은 lockdep이 반대 순서 획득을 허용하지 않는 규칙과 같은 취지다.
