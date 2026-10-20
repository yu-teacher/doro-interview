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
sources: ["https://pubs.opengroup.org/onlinepubs/9799919799/functions/pthread_spin_lock.html", "https://www.kernel.org/doc/html/latest/locking/mutex-design.html", "https://www.kernel.org/doc/html/latest/locking/spinlocks.html", "https://pubs.opengroup.org/onlinepubs/9799919799/functions/pthread_mutex_lock.html"]
---
**모범 답변 (30~60초)**
스핀락은 락을 못 얻으면 잠들지 않고 루프를 돌며 계속 확인하는 바쁜 대기 방식이고, 뮤텍스는 대기자를 재워 CPU를 양보하게 하는 방식입니다. 임계 구역이 아주 짧아서 곧 풀릴 때는 잠들고 깨는 컨텍스트 스위치를 피해 유리할 수 있고, 락을 오래 쥐면 기다리는 동안 CPU만 낭비합니다. 리눅스 커널의 뮤텍스도 락 소유자가 실행 중이면 곧 풀 가능성이 높다고 보고 잠시 스핀하다가 잠드는 방식을 씁니다. POSIX 스핀락은 우선순위 역전을 겪을 수 있다고 명시되어 있습니다.

(공식 문서) POSIX pthread_spin_lock은 락이 풀릴 때까지 스레드가 spin하며 반환하지 않는다고 하고, 응용 사용 절에서 우선순위 역전을 겪을 수 있다고 적는다. 커널 mutex 문서는 뮤텍스 획득 경로를 cmpxchg 빠른 경로, 소유자가 실행 중이고 더 높은 우선순위로 실행할 태스크가 없는 동안 스핀하는 중간 경로(optimistic spinning, CONFIG_MUTEX_SPIN_ON_OWNER 설정에서), 대기열에 들어가 잠드는 느린 경로로 설명하며, 소유자가 실행 중이면 곧 락을 풀 가능성이 높다는 것이 이유라고 한다. 커널 spinlocks 문서는 인터럽트가 같은 CPU에서 이미 잡힌 스핀락을 다시 잡으려 하면 영원히 풀리지 않는 교착이 되므로 인터럽트 핸들러에서 쓰는 락은 irq 버전을 써야 한다고 한다.
(실험 확인) macOS 26.6.2(Darwin 25.6.0), Apple M5 Pro, Apple clang 21. 이 환경에는 pthread_spinlock_t 타입이 없어서(컴파일 오류) atomic_flag로 직접 만든 test-and-set 스핀락을 썼다. 한 스레드가 락을 약 1초 쥐고 있는 동안 3개 스레드가 기다리게 하면 스핀락은 벽시계 1.01초에 CPU 시간 2.69초를, 뮤텍스는 1.00초에 CPU 시간 0.00초를 썼다. 반대로 임계 구역이 한 줄(카운터 증가)인 경쟁에서는 스레드 2개일 때 뮤텍스 0.047초, 직접 만든 스핀락 0.111초, 스레드 4개일 때 0.083초와 0.529초로 이 환경의 pthread 뮤텍스가 더 빨랐다. 짧은 임계 구역에서 스핀락이 유리하다는 주장은 이 실험으로 뒷받침하지 못했고, 이 결과는 내가 만든 단순한 스핀락과 macOS 뮤텍스 구현에 한정된다.
(보충) 임계 구역이 아주 짧을 때 스핀락이 컨텍스트 스위치를 피해 유리할 수 있다는 일반 설명과, 코어가 하나뿐이면 스핀하는 동안 락 소유자가 실행될 수 없어 스핀이 손해라는 설명은 읽은 문서에 직접 없다(커널 문서는 소유자가 실행 중이면 곧 풀 가능성이 높다는 이유만 밝힌다).
