---
slug: "osp-05"
topic: "cs-os-process"
tier: BASIC
difficulty: 1
title: "경쟁 상태(race condition)와 임계 구역은 무엇이고 어떻게 막나요?"
keywords: ["공유 데이터 동시 접근", "읽기-수정-쓰기", "임계 구역", "상호 배제", "원자 연산"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://pubs.opengroup.org/onlinepubs/9799919799/basedefs/V1_chap03.html", "https://pubs.opengroup.org/onlinepubs/9799919799/basedefs/V1_chap04.html", "https://pubs.opengroup.org/onlinepubs/9799919799/functions/pthread_mutex_lock.html", "https://pages.cs.wisc.edu/~remzi/OSTEP/"]
refs: ["OSTEP, Concurrency: An Introduction (threads-intro), 26.3 Why It Gets Worse: Shared Data(실행마다 다른 결과), PDF p.8", "OSTEP, Concurrency: An Introduction (threads-intro), 26.4 The Heart Of The Problem: Uncontrolled Scheduling, PDF p.9-10", "OSTEP, Concurrency: An Introduction (threads-intro), 26.5 The Wish For Atomicity, PDF p.11-12", "OSTEP, Concurrency: An Introduction (threads-intro), Aside: Key Concurrency Terms, PDF p.13"]
concepts: [race-condition]
importance: 3
links: [{to: "osp-06", kind: FOLLOWUP}, {to: "osp-19", kind: FOLLOWUP}, {to: "jt-04", kind: RELATED}]
---
**모범 답변 (30~60초)**
경쟁 상태는 여러 실행 흐름이 같은 데이터를 동시에 접근하고 그중 적어도 하나가 쓰기라서, 결과가 실행 순서에 따라 달라지는 문제입니다. count++도 읽기, 더하기, 쓰기의 세 단계라서 두 스레드가 겹치면 한쪽 갱신이 사라집니다. 이렇게 공유 데이터를 건드리는 코드 구간이 임계 구역이고, 한 번에 한 흐름만 들어가도록 뮤텍스로 상호 배제를 하거나 원자 연산으로 바꿔서 막습니다. 임계 구역은 가능한 짧게 유지하는 것이 좋고, 이 문제는 실행 순서가 운 나쁘게 겹칠 때만 드러나서 재현하기 어렵습니다.

(공식 문서) POSIX 정의 장은 데이터 레이스(3.97)를 서로 다른 스레드에서 충돌하는 두 동작 중 적어도 하나가 원자적이지 않고 어느 쪽도 상대보다 먼저 일어남(happens-before)이 성립하지 않는 상황으로 정의한다. 뮤텍스(3.215)는 여러 스레드가 공유 데이터에 대한 접근을 직렬화하는 동기화 객체이고, 락 없는 연산(3.195)은 데이터 레이스를 피하는 데 뮤텍스 같은 락이 필요 없는 연산이며, 원자 연산(3.32)은 더 작은 부분으로 쪼갤 수 없고 완전히 끝나거나 전혀 일어나지 않는 연산이다. 4.15.2는 락 없는 방식이 아닌 한 한 스레드가 수정할 수 있는 메모리를 다른 스레드가 읽거나 수정하지 못하게 제한해야 하며 pthread_mutex_lock·unlock 등이 메모리 동기화를 한다고 한다.
(실험 확인) macOS 26.6.2(Darwin 25.6.0), Apple M5 Pro, Apple clang 21. 스레드 4개가 각각 100만 번 증가시킬 때 기대값 4,000,000에 대해 보호 없는 volatile long 증가는 5회 모두 3,996,9xx~3,997,5xx로 갱신이 유실됐고, 같은 루프에서 돌린 뮤텍스 카운터와 atomic_fetch_add 카운터는 5회 모두 4,000,000이었다(-O0 빌드). 유실 개수는 실행마다 다르다.
(원저자 자료) OSTEP 동시성 입문 장(threads-intro) 26.4절은 카운터를 1 올리는 코드가 메모리 읽기, 더하기, 메모리 쓰기의 세 명령으로 컴파일되고, 타이머 인터럽트로 스레드가 중간에 바뀌면 두 스레드가 같은 값을 읽어 한 번의 증가가 사라질 수 있다고 추적해 보인다. 이처럼 결과가 실행 타이밍에 달린 상황을 경쟁 상태(race condition)라 하고, 책은 이를 더 구체적으로 data race라고도 부르며, 이런 코드가 있으면 프로그램의 결과가 실행마다 달라질 수 있는 비결정적(indeterminate) 프로그램이 된다고 한다(책의 실행 예에서도 실행마다 최종 값이 달랐다). 공유 자원에 접근하며 둘 이상의 스레드가 동시에 실행하면 안 되는 코드 조각을 임계 구역이라 정의하고, 이를 막으려면 한 스레드만 임계 구역에 들어가게 하는 상호 배제가 필요하다고 한다. 26.5절은 세 명령을 전부 일어나거나 전혀 일어나지 않는 원자적 단위로 실행하기를 바라지만 일반적으로 그런 명령은 없으므로, 하드웨어가 주는 몇 가지 원자 명령 위에 동기화 기본 요소를 만들어 짧은 명령 묶음을 원자적으로 실행한다고 설명한다. POSIX는 데이터 레이스를 서로 다른 스레드의 충돌하는 동작 사이에 happens-before가 없는 경우로 좁게 정의하지만 OSTEP은 race condition과 data race를 같은 뜻으로 병기한다.
(보충) 데이터 레이스가 없어도 순서에 따른 논리 오류는 생길 수 있다는 구분과, 임계 구역을 짧게 두라는 권고는 일반 설명이다.
