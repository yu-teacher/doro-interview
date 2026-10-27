---
slug: "osm-04"
topic: "cs-os-memory"
tier: BASIC
difficulty: 2
title: "페이징은 가상 주소를 어떻게 물리 주소로 바꾸고, 세그멘테이션과는 무엇이 다른가요?"
keywords: ["고정 크기 페이지와 프레임", "페이지 번호와 오프셋", "계층형 페이지 테이블", "희소한 주소 공간의 메모리 절약", "세그멘테이션은 가변 크기"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://www.kernel.org/doc/html/latest/admin-guide/mm/concepts.html", "https://www.kernel.org/doc/html/latest/mm/page_tables.html", "https://pages.cs.wisc.edu/~remzi/OSTEP/"]
refs: ["OSTEP, 16장 Segmentation(16.1, 16.6 외부 단편화, 16.7 Summary), PDF p.1, 9-10", "OSTEP, 18장 Paging: Introduction(도입), PDF p.1"]
concepts: [virtual-memory]
importance: 3
links: [{to: "osm-05", kind: FOLLOWUP}, {to: "osm-08", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
페이징은 물리 메모리를 고정 크기의 프레임으로, 가상 주소 공간을 같은 크기의 페이지로 나누고 페이지 테이블로 대응시키는 방식입니다. 가상 주소의 상위 비트는 페이지 번호로 테이블을 찾는 인덱스가 되고, 하위 비트는 페이지 안의 오프셋이 됩니다. 한 줄짜리 거대한 테이블은 대부분 비어 있어 낭비가 크므로, 상위 테이블이 하위 테이블을 가리키는 계층형으로 만들어 안 쓰는 큰 구간은 상위에서 비어 있다고만 표시합니다. 세그멘테이션은 코드·데이터·스택처럼 의미 단위로 가변 크기 구간을 나누는 방식이라 외부 단편화가 생기기 쉽고, 현대 범용 OS는 페이징을 중심으로 씁니다.

(공식 문서) 커널 문서(Concepts overview, page_tables)는 물리 메모리가 페이지 프레임으로 나뉘고 크기는 아키텍처마다 다르며, 페이지 테이블이 계층으로 구성되어 맨 위 테이블의 포인터가 레지스터에 있고 가상 주소의 상위 비트가 각 단계의 인덱스, 최하위 비트가 페이지 안 오프셋이라고 설명한다. 단일 선형 테이블은 쓰지 않는 영역 때문에 아주 성기게 되므로 계층형이 메모리를 아끼고(큰 빈 구간은 상위 단계에서 매핑 없음으로 표시), 커널 문서 7.3 기준 Linux는 5단계(PGD, P4D, PUD, PMD, PTE)까지 정의하며 아키텍처가 안 쓰는 단계는 접는다(folded)고 한다. 4KB 페이지에서 PAGE_SHIFT는 12이다.
(원저자 자료) OSTEP 16장(Segmentation, 16.1)은 세그멘테이션을 주소 공간의 논리적 구역(코드·힙·스택 등)마다 베이스·바운드 쌍을 두는 방식으로 설명하고, 세그먼트는 주소 공간의 특정 길이를 가진 연속 구간이라고 정의한다. 16.6·16.7은 세그먼트 크기가 제각각이라 물리 메모리가 작은 빈 조각들로 쪼개지는 외부 단편화가 생기고, 압축은 비싸며 똑똑한 알고리즘을 써도 문제가 남는다고 하고, 18장(Paging: Introduction)은 가변 크기로 나누는 접근의 고유한 어려움을 피하려고 고정 크기 조각으로 나누는 것이 페이징이라고 대비한다.
(보충) "현대 범용 OS는 페이징 중심"이라는 요약은 OSTEP에서 이 문장 그대로 확인하지 못했다.
