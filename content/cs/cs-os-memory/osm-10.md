---
slug: "osm-10"
topic: "cs-os-memory"
tier: DEEP
difficulty: 2
title: "페이지 교체 알고리즘 FIFO, LRU, Clock은 각각 어떻게 동작하고 어떤 차이가 있나요?"
keywords: ["FIFO는 가장 먼저 들어온 페이지 교체", "LRU는 가장 오래 쓰지 않은 페이지 교체", "정확한 LRU의 기록 비용", "Clock은 참조 비트로 근사", "실제 OS는 접근 비트 기반 LRU 근사"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.kernel.org/doc/html/latest/mm/multigen_lru.html", "https://www.kernel.org/doc/html/latest/admin-guide/mm/multigen_lru.html"]
---
**모범 답변 (30~60초)**
물리 메모리가 가득 찼을 때 어떤 페이지를 내보낼지 정하는 규칙이 페이지 교체 알고리즘입니다. FIFO는 가장 먼저 들어온 페이지를 내보내서 구현이 단순하지만 자주 쓰는 페이지도 나이만으로 쫓겨날 수 있습니다. LRU는 가장 오래 쓰지 않은 페이지를 내보내서 최근에 쓴 것이 곧 또 쓰인다는 지역성에 잘 맞지만, 모든 접근을 정확히 기록하기는 비용이 큽니다. Clock은 페이지를 원형으로 두고 참조 비트가 켜진 페이지에게 한 번 기회를 주며 비트를 끄고 넘어가는 LRU 근사입니다. Linux도 페이지 테이블의 접근 비트를 읽어 최근성을 근사합니다.

(공식 문서) 커널 multi-gen LRU 문서(Design overview)는 모든 LRU 구현의 핵심이 접근 최근성의 표현이라고 하고, 페이지 테이블의 접근 비트를 이용해 접근 패턴을 판단하되 접근 비트가 근사치라는 점을 설계 가정으로 밝히며, 비슷한 최근성끼리 묶은 세대(generation)로 나눠 오래된 세대를 소비(eviction)하는 방식이라고 설명한다. 이 구현은 전통적 LRU의 대안이며 `CONFIG_LRU_GEN`으로 켠다고 admin-guide 문서가 말한다.
(실험 확인) 파이썬과 C로 따로 만든 FIFO·LRU·Clock(참조 비트 1개의 단순 구현)·최적(OPT) 시뮬레이터에 교과서에 흔한 참조열 `1,2,3,4,1,2,5,1,2,3,4,5`를 넣었다. 두 구현 모두 프레임 3개일 때 폴트 수는 FIFO 9, LRU 10, Clock 9, OPT 7이었고 프레임 4개일 때는 FIFO 10, LRU 8, Clock 10, OPT 6이었다. 이 한 입력의 결과이며 알고리즘 우열을 일반화하지 않는다.
(보충) FIFO·LRU·Clock의 동작 정의와 "정확한 LRU는 접근마다 기록해야 해서 비용이 크다"는 설명은 일반 교재식 설명이며 이번에 읽은 공식 출처가 이 알고리즘들을 이름 붙여 정의하지는 않는다.
