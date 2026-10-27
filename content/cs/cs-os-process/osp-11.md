---
slug: "osp-11"
topic: "cs-os-process"
tier: DEEP
difficulty: 2
title: "스핀락과 뮤텍스는 어떻게 다르고, 언제 스핀락이 유리한가요?"
keywords: ["바쁜 대기", "잠들지 않고 반복 확인", "임계 구역이 매우 짧을 때", "CPU 낭비", "컨텍스트 스위치 회피"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://pubs.opengroup.org/onlinepubs/9799919799/functions/pthread_spin_lock.html", "https://www.kernel.org/doc/html/latest/locking/mutex-design.html", "https://www.kernel.org/doc/html/latest/locking/spinlocks.html", "https://pubs.opengroup.org/onlinepubs/9799919799/functions/pthread_mutex_lock.html", "https://pages.cs.wisc.edu/~remzi/OSTEP/"]
refs: ["OSTEP, Locks (threads-locks), 28.7-28.8 Spin Locks and Evaluating Spin Locks, PDF p.9-10", "OSTEP, Locks (threads-locks), 28.13 A Simple Approach: Just Yield, PDF p.15", "OSTEP, Locks (threads-locks), 28.16 Two-Phase Locks, PDF p.20"]
concepts: [race-condition]
importance: 2
---
**모범 답변 (30~60초)**
스핀락은 락을 못 얻으면 잠들지 않고 루프를 돌며 계속 확인하는 바쁜 대기 방식이고, 뮤텍스는 대기자를 재워 CPU를 양보하게 하는 방식입니다. 임계 구역이 아주 짧아서 곧 풀릴 때는 잠들고 깨는 컨텍스트 스위치를 피해 유리할 수 있고, 락을 오래 쥐면 기다리는 동안 CPU만 낭비합니다. 리눅스 커널의 뮤텍스도 락 소유자가 실행 중이면 곧 풀 가능성이 높다고 보고 잠시 스핀하다가 잠드는 방식을 씁니다. POSIX 스핀락은 우선순위 역전을 겪을 수 있다고 명시되어 있습니다.

(공식 문서) POSIX pthread_spin_lock은 락이 풀릴 때까지 스레드가 spin하며 반환하지 않는다고 하고, 응용 사용 절에서 우선순위 역전을 겪을 수 있다고 적는다. 커널 mutex 문서는 뮤텍스 획득 경로를 cmpxchg 빠른 경로, 소유자가 실행 중이고 더 높은 우선순위로 실행할 태스크가 없는 동안 스핀하는 중간 경로(optimistic spinning, CONFIG_MUTEX_SPIN_ON_OWNER 설정에서), 대기열에 들어가 잠드는 느린 경로로 설명하며, 소유자가 실행 중이면 곧 락을 풀 가능성이 높다는 것이 이유라고 한다. 커널 spinlocks 문서는 인터럽트가 같은 CPU에서 이미 잡힌 스핀락을 다시 잡으려 하면 영원히 풀리지 않는 교착이 되므로 인터럽트 핸들러에서 쓰는 락은 irq 버전을 써야 한다고 한다.
(실험 확인) macOS 26.6.2(Darwin 25.6.0), Apple M5 Pro, Apple clang 21. 이 환경에는 pthread_spinlock_t 타입이 없어서(컴파일 오류) atomic_flag로 직접 만든 test-and-set 스핀락을 썼다. 한 스레드가 락을 약 1초 쥐고 있는 동안 3개 스레드가 기다리게 하면 스핀락은 벽시계 1.01초에 CPU 시간 2.69초를, 뮤텍스는 1.00초에 CPU 시간 0.00초를 썼다. 반대로 임계 구역이 한 줄(카운터 증가)인 경쟁에서는 스레드 2개일 때 뮤텍스 0.047초, 직접 만든 스핀락 0.111초, 스레드 4개일 때 0.083초와 0.529초로 이 환경의 pthread 뮤텍스가 더 빨랐다. 짧은 임계 구역에서 스핀락이 유리하다는 주장은 이 실험으로 뒷받침하지 못했고, 이 결과는 내가 만든 단순한 스핀락과 macOS 뮤텍스 구현에 한정된다.
(원저자 자료) OSTEP 락 장(threads-locks)은 test-and-set 같은 원자 명령으로 만든 락이 풀릴 때까지 CPU를 쓰며 돌아 스핀락이라 불린다고 설명한다. 선점형 스케줄러가 없으면 스핀하는 스레드가 CPU를 놓지 않아 단일 CPU에서는 의미가 없고, 선점이 있는 단일 CPU에서도 락 보유 스레드가 임계 구역 안에서 선점되면 나머지 스레드가 각자 한 타임 슬라이스 동안 헛돌아 CPU를 낭비한다고 한다. 반대로 다중 CPU에서는 스레드 수가 CPU 수와 비슷할 때 스핀락이 꽤 잘 동작하는데, 임계 구역이 짧아 락이 곧 풀리므로 다른 CPU에서 락을 기다리는 동안 낭비되는 사이클이 많지 않기 때문이라고 한다. 책은 스핀 대신 CPU를 양보하는 방식도 스레드가 많으면 컨텍스트 스위치 비용이 커진다고 하고, 먼저 스핀하며 락을 얻어 보고 실패하면 잠드는 두 단계 락을 소개하며, 책에 실린 리눅스 futex 기반 락은 스핀을 한 번만 하는 그 한 형태라고 설명한다.
(보충) 스핀락이 잠들고 깨는 컨텍스트 스위치를 피해 유리하다는 직접적인 비교는 OSTEP도 하지 않고, 책은 다중 CPU에서 임계 구역이 짧으면 스핀 낭비가 크지 않다고만 한다.
