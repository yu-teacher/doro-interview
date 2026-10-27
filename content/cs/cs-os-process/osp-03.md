---
slug: "osp-03"
topic: "cs-os-process"
tier: BASIC
difficulty: 2
title: "컨텍스트 스위치는 무엇이고 왜 비용이 드나요? PCB는 무엇인가요?"
keywords: ["실행 상태 저장·복원", "PCB", "프로그램 카운터·레지스터", "순수 오버헤드", "캐시·TLB 영향"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://man7.org/linux/man-pages/man7/sched.7.html", "https://www.kernel.org/doc/html/latest/locking/mutex-design.html", "https://man7.org/linux/man-pages/man2/fork.2.html", "https://pages.cs.wisc.edu/~remzi/OSTEP/"]
refs: ["OSTEP, Mechanism: Limited Direct Execution (cpu-mechanisms), Saving and Restoring Context, PDF p.9-10", "OSTEP, The Abstraction: The Process (cpu-intro), 4.5 Data Structures(PCB), PDF p.7-9", "OSTEP, Scheduling: Introduction (cpu-sched), 7.7 Round Robin(전환 비용·캐시·TLB 상태), PDF p.8", "OSTEP, Paging: Faster Translations (vm-tlbs), 19.5 TLB Issue: Context Switches, PDF p.9-10", "OSTEP, Concurrency: An Introduction (threads-intro), 도입부(스레드 전환), PDF p.1"]
concepts: [process-management, thread-process]
importance: 3
links: [{to: "osm-12", kind: RELATED}]
---
**모범 답변 (30~60초)**
컨텍스트 스위치는 CPU가 실행하던 흐름의 상태, 즉 프로그램 카운터와 레지스터 등을 저장하고 다음에 실행할 흐름의 상태를 복원해 넘기는 일입니다. 운영체제가 프로세스마다 상태, 레지스터 저장 공간, 주소 공간, 열린 파일 같은 정보를 모아 두는 구조가 PCB입니다. 전환하는 동안에는 사용자 작업이 진행되지 않는 순수한 오버헤드이고, 다른 프로세스로 바뀌면 주소 공간이 달라져 캐시와 TLB 효율도 떨어지기 쉬워서 같은 프로세스 안의 스레드 전환보다 보통 무겁습니다.

(공식 문서) sched(7)는 스케줄러를 실행 가능한 스레드 중 다음에 CPU가 실행할 것을 정하는 커널 구성요소로 설명하고, 커널 mutex 문서는 락 소유자를 task_struct 포인터로 추적한다고 적으며, fork(2)는 리눅스 fork가 자식을 위해 고유한 task 구조를 만든다고 한다. 리눅스가 태스크를 task 구조로 표현한다는 점은 여기서 확인되지만, PCB라는 용어와 그 구성, 컨텍스트 스위치의 정의는 읽은 공식 문서에 없다.
(실험 확인) macOS 26.6.2(Darwin 25.6.0), Apple M5 Pro, Apple clang 21. 파이프 핑퐁(한 바이트를 주고받는 왕복) 10만 회 평균이 프로세스 둘 사이에서 5.09 µs와 4.94 µs(두 번 측정), 같은 프로세스의 스레드 둘 사이에서 4.60 µs와 4.58 µs였다. 즉 이 환경에서 프로세스 간이 약 8~11% 느렸다. 왕복 한 번에 read/write 시스템 콜 4번과 전환이 함께 들어 있어 순수 전환 비용이 아니며, 캐시·TLB 영향은 측정하지 않았다.
(원저자 자료) OSTEP 제한된 직접 실행 장(cpu-mechanisms)은 스케줄러가 전환하기로 하면 OS가 저수준 코드로 실행 중이던 프로세스의 범용 레지스터, 프로그램 카운터, 커널 스택 포인터를 저장하고 다음 프로세스의 것을 복원해 커널 스택을 바꾼다고 하며, 이것이 컨텍스트 스위치라고 설명한다. 프로세스 장(cpu-intro)은 프로세스 정보를 담는 구조를 프로세스 제어 블록(PCB)이라 부르고, xv6의 예로 메모리 정보, 상태, PID, 부모, 열린 파일, 레지스터 문맥이 들어 있다고 보이며 리눅스·macOS·윈도우에도 비슷하지만 더 복잡한 구조가 있다고 한다. 스케줄링 입문 장(cpu-sched)은 타임 슬라이스 10ms에 전환 1ms가 든다면 시간의 약 10%가 낭비되는 셈이라고 계산하고, 전환 비용이 레지스터 저장·복원만이 아니라 CPU 캐시, TLB, 분기 예측기에 쌓인 상태를 비우고 새로 채우는 비용을 포함한다고 한다. TLB 장(vm-tlbs)은 프로세스를 바꾸면 TLB의 번역이 새 프로세스에 맞지 않아 TLB를 비우거나 ASID로 구분해야 하고, 비우는 방식에서는 프로세스가 다시 돌 때마다 TLB 미스를 겪으므로 전환이 잦으면 비용이 커질 수 있다고 한다. 스레드 입문 장(threads-intro)은 같은 프로세스 안의 스레드 전환은 주소 공간이 같아 페이지 테이블을 바꿀 필요가 없다는 점이 프로세스 전환과 다르다고 한다.
