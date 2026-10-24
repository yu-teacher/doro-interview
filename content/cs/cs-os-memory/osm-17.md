---
slug: "osm-17"
topic: "cs-os-memory"
tier: TRICKY
difficulty: 3
title: "스래싱(thrashing)은 무엇이고 왜 발생하며 어떻게 완화하나요?"
keywords: ["작업 집합이 물리 메모리보다 큼", "폴트와 교체가 계속 반복", "실제 연산보다 I/O 대기", "작업 집합 보호·프로세스 수 줄이기", "OOM killer로 압력 해소"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.kernel.org/doc/html/latest/admin-guide/mm/multigen_lru.html", "https://www.kernel.org/doc/html/latest/admin-guide/mm/concepts.html", "https://www.kernel.org/doc/html/latest/mm/multigen_lru.html", "https://pages.cs.wisc.edu/~remzi/OSTEP/"]
refs: ["OSTEP, 22장 Beyond Physical Memory: Policies(22.11 Thrashing), PDF p.14"]
concepts: [virtual-memory]
importance: 1
links: [{to: "osm-10", kind: PREREQ}]
---
**모범 답변 (30~60초)**
스래싱은 지금 활발히 쓰는 페이지들의 합, 곧 작업 집합이 물리 메모리보다 커서 페이지 폴트와 교체가 계속 반복되는 상태입니다. 방금 내보낸 페이지가 곧바로 다시 필요해져서 CPU가 일은 못 하고 디스크 입출력만 기다리게 되고, 체감 성능이 급격히 무너집니다. 폴트율은 프레임이 작업 집합에 못 미치는 순간 완만하게 나빠지는 것이 아니라 벼랑처럼 치솟을 수 있습니다. 완화하려면 동시에 돌리는 작업 수나 메모리 사용량을 줄이고 메모리를 늘리는 것이 기본입니다. 커널은 회수로 감당이 안 되면 OOM killer로 프로세스를 종료하고, multi-gen LRU에서는 최근 작업 집합을 지키도록 설정할 수도 있습니다.

(공식 문서) Linux multi-gen LRU 문서(admin-guide의 Thrashing prevention 절)는 스래싱이 UI 지연 등으로 사용자 경험을 해치므로, `min_ttl_ms`에 N을 쓰면 최근 N밀리초의 작업 집합이 쫓겨나지 않게 보호하고 이를 유지하지 못하면 OOM killer를 발동한다고 설명한다(기본값 0은 비활성, N=1000이 흔한 값이라고 제시). 이 보호는 multi-gen LRU의 선택 설정이다. Concepts overview는 메모리가 줄면 kswapd가 비동기로, 더 모자라면 직접 회수(direct reclaim)로 할당이 지연되고, 회수가 충분하지 않으면 OOM killer가 프로세스를 종료한다고 한다.
(실험 확인) 직접 만든 LRU 시뮬레이터에 10개 페이지를 순환 접근하는 참조 1,000번을 넣자 프레임 4·8·9개에서는 폴트가 1,000번(전부)이었고 프레임 10개와 12개에서는 10번(처음 한 번씩)뿐이었다. 지역성이 있는 합성 열(작은 핫셋 5페이지 90%)에서는 프레임 2개 때 폴트율 0.678, 5개 0.253, 8개 0.103, 50개 0.003이었다. 이는 폴트율 변화를 보여 주는 시뮬레이션이며 실제 시스템에서 스래싱을 일으켜 측정한 것은 아니다.
(원저자 자료) OSTEP 22장(Beyond Physical Memory: Policies, 22.11 Thrashing, PDF p.14)은 실행 중인 프로세스들의 메모리 요구 총합이 쓸 수 있는 물리 메모리를 넘어서 시스템이 끊임없이 페이징만 하는 상태를 스래싱이라 부른다. 대응으로 옛 운영체제들은 일부 프로세스를 아예 돌리지 않는 쪽을 택했는데, 줄어든 프로세스 집합의 작업 집합(활발히 쓰는 페이지들)이 메모리에 들어가 진척이 나게 하려는 것이며 이를 admission control이라 부르고 모든 것을 한꺼번에 엉망으로 하느니 일을 적게 잘하는 편이 낫다는 사고방식이라고 설명한다. 현대의 일부 Linux는 메모리가 초과 구독되면 OOM killer로 메모리를 많이 쓰는 프로세스를 죽이지만 엉뚱한 프로세스(예 X 서버)를 죽일 수 있다고 지적한다.
