---
slug: "osm-08"
topic: "cs-os-memory"
tier: DEEP
difficulty: 2
title: "TLB는 무엇이고, TLB 미스가 나면 어떤 일이 생기며 huge page는 왜 도움이 되나요?"
keywords: ["주소 변환 결과 캐시", "미스 시 페이지 테이블 워크", "변환에 여러 번 메모리 접근", "큰 작업 집합은 TLB 압박", "huge page로 항목 수 감소"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.kernel.org/doc/html/latest/admin-guide/mm/concepts.html", "https://www.kernel.org/doc/html/latest/mm/page_tables.html"]
concepts: [virtual-memory]
importance: 2
links: [{to: "osm-04", kind: PREREQ}]
---
**모범 답변 (30~60초)**
TLB는 가상 주소에서 물리 주소로의 변환 결과를 담아 두는 CPU 쪽의 작은 캐시입니다. 메모리 접근마다 변환이 필요한데 페이지 테이블은 여러 단계라 변환에 메모리 접근이 여러 번 필요하므로 매번 하면 너무 느립니다. TLB에 변환이 있으면 바로 쓰고, 없으면 MMU가 페이지 테이블을 따라가는 페이지 워크로 변환을 구해 채웁니다. 작업 집합이 큰 프로그램은 TLB가 모자라 미스가 잦아지는데, x86에서 2MB나 1GB 같은 huge page는 항목 하나가 훨씬 넓은 영역을 덮어 TLB 압박을 줄여 줍니다.

(공식 문서) 커널 Concepts overview(Huge Pages 절)는 주소 변환에 메모리 접근이 여러 번 필요하고 메모리 접근은 CPU 속도에 비해 느려서 CPU가 변환 캐시인 TLB를 두며, TLB는 부족한 자원이라 작업 집합이 큰 응용은 TLB 미스로 성능이 떨어진다고 설명한다. x86에서는 상위 단계(두 번째·세 번째 수준) 테이블 항목으로 2MB, 1GB 페이지를 직접 매핑할 수 있고 Linux는 이를 huge page라 부르며 TLB 압박을 줄이고 적중률을 높인다고 한다. page_tables 문서는 MMU가 비교적 작은 하드웨어 캐시인 TLB와 Page Walk Cache에서 변환을 찾고, 없으면 페이지 워크로 물리 주소를 구해 매핑을 만든다고 설명하며, huge page에는 낭비되는 메모리와 할당의 어려움이라는 대가도 있다고 덧붙인다.
