---
slug: "osp-05"
topic: "cs-os-process"
tier: BASIC
difficulty: 1
title: "경쟁 상태(race condition)와 임계 구역은 무엇이고 어떻게 막나요?"
keywords: ["공유 데이터 동시 접근", "읽기-수정-쓰기", "임계 구역", "상호 배제", "원자 연산"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://pubs.opengroup.org/onlinepubs/9799919799/basedefs/V1_chap03.html", "https://pubs.opengroup.org/onlinepubs/9799919799/basedefs/V1_chap04.html", "https://pubs.opengroup.org/onlinepubs/9799919799/functions/pthread_mutex_lock.html"]
concepts: [race-condition]
importance: 3
links: [{to: "osp-06", kind: FOLLOWUP}, {to: "osp-19", kind: FOLLOWUP}, {to: "jt-04", kind: RELATED}]
---
**모범 답변 (30~60초)**
경쟁 상태는 여러 실행 흐름이 같은 데이터를 동시에 접근하고 그중 적어도 하나가 쓰기라서, 결과가 실행 순서에 따라 달라지는 문제입니다. count++도 읽기, 더하기, 쓰기의 세 단계라서 두 스레드가 겹치면 한쪽 갱신이 사라집니다. 이렇게 공유 데이터를 건드리는 코드 구간이 임계 구역이고, 한 번에 한 흐름만 들어가도록 뮤텍스로 상호 배제를 하거나 원자 연산으로 바꿔서 막습니다. 임계 구역은 가능한 짧게 유지하는 것이 좋고, 이 문제는 실행 순서가 운 나쁘게 겹칠 때만 드러나서 재현하기 어렵습니다.

(공식 문서) POSIX 정의 장은 데이터 레이스(3.97)를 서로 다른 스레드에서 충돌하는 두 동작 중 적어도 하나가 원자적이지 않고 어느 쪽도 상대보다 먼저 일어남(happens-before)이 성립하지 않는 상황으로 정의한다. 뮤텍스(3.215)는 여러 스레드가 공유 데이터에 대한 접근을 직렬화하는 동기화 객체이고, 락 없는 연산(3.195)은 데이터 레이스를 피하는 데 뮤텍스 같은 락이 필요 없는 연산이며, 원자 연산(3.32)은 더 작은 부분으로 쪼갤 수 없고 완전히 끝나거나 전혀 일어나지 않는 연산이다. 4.15.2는 락 없는 방식이 아닌 한 한 스레드가 수정할 수 있는 메모리를 다른 스레드가 읽거나 수정하지 못하게 제한해야 하며 pthread_mutex_lock·unlock 등이 메모리 동기화를 한다고 한다.
(실험 확인) macOS 26.6.2(Darwin 25.6.0), Apple M5 Pro, Apple clang 21. 스레드 4개가 각각 100만 번 증가시킬 때 기대값 4,000,000에 대해 보호 없는 volatile long 증가는 5회 모두 3,996,9xx~3,997,5xx로 갱신이 유실됐고, 같은 루프에서 돌린 뮤텍스 카운터와 atomic_fetch_add 카운터는 5회 모두 4,000,000이었다(-O0 빌드). 유실 개수는 실행마다 다르다.
(보충) 경쟁 상태(race condition)와 POSIX의 데이터 레이스는 같은 말이 아니다. 데이터 레이스가 없어도 순서에 따른 논리 오류는 생길 수 있다는 구분, 임계 구역이라는 용어의 정의, count++가 세 단계라는 설명, 임계 구역을 짧게 두라는 권고와 재현이 어렵다는 서술은 일반 설명이다.
