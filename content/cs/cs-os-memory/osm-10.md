---
slug: "osm-10"
topic: "cs-os-memory"
tier: DEEP
difficulty: 2
title: "페이지 교체 알고리즘 FIFO, LRU, Clock은 각각 어떻게 동작하고 어떤 차이가 있나요?"
keywords: ["FIFO는 가장 먼저 들어온 페이지 교체", "LRU는 가장 오래 쓰지 않은 페이지 교체", "정확한 LRU의 기록 비용", "Clock은 참조 비트로 근사", "실제 OS는 접근 비트 기반 LRU 근사"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.kernel.org/doc/html/latest/mm/multigen_lru.html", "https://www.kernel.org/doc/html/latest/admin-guide/mm/multigen_lru.html", "https://pages.cs.wisc.edu/~remzi/OSTEP/"]
refs: ["OSTEP, 22장 Beyond Physical Memory: Policies(22.3 FIFO, 22.5 Using History: LRU), PDF p.4-5, 7", "OSTEP, 22장 Beyond Physical Memory: Policies(22.7 Implementing Historical Algorithms, 22.8 Approximating LRU), PDF p.11-12"]
concepts: [virtual-memory]
importance: 2
links: [{to: "osm-16", kind: FOLLOWUP}, {to: "osm-17", kind: FOLLOWUP}, {to: "ds-19", kind: RELATED}]
---
**모범 답변 (30~60초)**
물리 메모리가 가득 찼을 때 어떤 페이지를 내보낼지 정하는 규칙이 페이지 교체 알고리즘입니다. FIFO는 가장 먼저 들어온 페이지를 내보내서 구현이 단순하지만 자주 쓰는 페이지도 나이만으로 쫓겨날 수 있습니다. LRU는 가장 오래 쓰지 않은 페이지를 내보내서 최근에 쓴 것이 곧 또 쓰인다는 지역성에 잘 맞지만, 모든 접근을 정확히 기록하기는 비용이 큽니다. Clock은 페이지를 원형으로 두고 참조 비트가 켜진 페이지에게 한 번 기회를 주며 비트를 끄고 넘어가는 LRU 근사입니다. Linux도 페이지 테이블의 접근 비트를 읽어 최근성을 근사합니다.

(공식 문서) 커널 multi-gen LRU 문서(Design overview)는 모든 LRU 구현의 핵심이 접근 최근성의 표현이라고 하고, 페이지 테이블의 접근 비트를 이용해 접근 패턴을 판단하되 접근 비트가 근사치라는 점을 설계 가정으로 밝히며, 비슷한 최근성끼리 묶은 세대(generation)로 나눠 오래된 세대를 소비(eviction)하는 방식이라고 설명한다. 이 구현은 전통적 LRU의 대안이며 `CONFIG_LRU_GEN`으로 켠다고 admin-guide 문서가 말한다.
(실험 확인) 파이썬과 C로 따로 만든 FIFO·LRU·Clock(참조 비트 1개의 단순 구현)·최적(OPT) 시뮬레이터에 교과서에 흔한 참조열 `1,2,3,4,1,2,5,1,2,3,4,5`를 넣었다. 두 구현 모두 프레임 3개일 때 폴트 수는 FIFO 9, LRU 10, Clock 9, OPT 7이었고 프레임 4개일 때는 FIFO 10, LRU 8, Clock 10, OPT 6이었다. 이 한 입력의 결과이며 알고리즘 우열을 일반화하지 않는다.
(원저자 자료) OSTEP 22장(Beyond Physical Memory: Policies)은 FIFO를 페이지가 들어온 순서의 큐에서 가장 먼저 들어온 페이지를 내보내는 방식으로 정의하고 구현이 매우 단순한 것이 장점이라고 하되, 여러 번 쓰인 페이지도 첫 번째로 들어왔다는 이유만으로 쫓겨나 중요도를 판단하지 못한다고 한다(22.3, PDF p.4-5). LRU는 과거 접근 기록을 이용해 가장 오래 쓰이지 않은 페이지를 내보내는 방식이다(22.5, PDF p.7). 정확한 LRU는 모든 메모리 접근마다 페이지를 목록의 앞으로 옮기는 식의 기록 작업이 필요해 FIFO와 달리 성능을 크게 해칠 수 있으며(22.7, PDF p.11), 페이지가 100만 개쯤이면 가장 오래된 페이지를 찾는 것만으로 너무 오래 걸린다고 한다. 그 대안으로 22.8은 하드웨어가 접근 때 켜는 use bit(참조 비트)를 쓰는 LRU 근사를 설명하고, clock 알고리즘은 페이지를 원형 목록에 두고 시계 바늘이 가리킨 페이지의 비트가 1이면 0으로 지우고 다음으로 넘어가며 비트가 0인 페이지를 찾으면 내보낸다고 한다(PDF p.12).
