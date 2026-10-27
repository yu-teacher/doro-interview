---
slug: "osm-05"
topic: "cs-os-memory"
tier: BASIC
difficulty: 1
title: "내부 단편화와 외부 단편화는 무엇이고, 페이징은 어느 쪽을 해결하나요?"
keywords: ["할당 단위 내부 낭비", "자유 공간이 흩어져 큰 연속 공간 확보 실패", "페이징은 외부 단편화 완화", "마지막 페이지 낭비", "압축(compaction)"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.kernel.org/doc/html/latest/admin-guide/mm/concepts.html", "https://pubs.opengroup.org/onlinepubs/9799919799/functions/mmap.html", "https://pages.cs.wisc.edu/~remzi/OSTEP/"]
refs: ["OSTEP, 17장 Free-Space Management(도입, 17.1 Assumptions), PDF p.1-2", "OSTEP, 18장 Paging: Introduction(18.6 Summary), PDF p.12", "OSTEP, 20장 Paging: Smaller Tables(20.1 Simple Solution: Bigger Pages), PDF p.2"]
concepts: [virtual-memory]
importance: 2
links: [{to: "osm-04", kind: PREREQ}]
---
**모범 답변 (30~60초)**
내부 단편화는 할당 단위가 요청보다 커서 할당된 블록 안쪽에 남는 낭비이고, 외부 단편화는 빈 공간의 총량은 충분한데 조각나서 큰 연속 공간을 못 내주는 상황입니다. 페이징은 메모리를 고정 크기 페이지로 다뤄서 가상 주소 공간에서는 흩어진 물리 페이지를 연속된 것처럼 보여 주므로 외부 단편화 문제를 크게 줄입니다. 대신 요청 크기가 페이지 크기의 배수가 아니면 마지막 페이지가 남아 내부 단편화가 생깁니다. 물리적으로 연속된 큰 영역이 꼭 필요하면 커널은 페이지를 옮겨 빈 곳을 모으는 압축(compaction)을 씁니다.

(공식 문서) 커널 Concepts overview의 Compaction 절은 메모리를 할당·해제하다 보면 단편화가 생기며, 가상 메모리 덕분에 흩어진 물리 페이지를 가상으로 연속된 범위로 보여 줄 수 있지만 DMA 버퍼나 huge page처럼 물리적으로 연속된 큰 영역이 필요할 때는 compaction으로 점유 페이지를 옮겨 빈 페이지를 한곳에 모은다고 설명한다. POSIX `mmap`(DESCRIPTION)은 매핑이 페이지 단위로 이루어지고 파일 끝 부분 페이지의 나머지를 0으로 채운다고 한다.
(실험 확인) macOS(Apple Silicon, 페이지 16KB)에서 `mmap`으로 길이 1바이트를 요청했는데 그 페이지의 마지막 바이트(오프셋 16383)까지 쓸 수 있었고, 페이지 크기 오프셋(16384)에 쓰자 SIGSEGV가 났다. `malloc_size`로 보면 `malloc(1)`은 16바이트, `malloc(100)`은 112바이트, `malloc(5000)`은 5120바이트를 실제로 확보했다(macOS 할당자 기준이며 구현마다 다르다).
(원저자 자료) OSTEP 17장(Free-Space Management)은 외부 단편화를 빈 공간이 크기가 다른 작은 조각들로 쪼개져, 빈 공간의 총합이 요청보다 커도 연속된 하나로는 요청을 못 채우는 현상으로 정의한다(예로 10바이트 조각 둘이 있을 때 15바이트 요청이 실패한다). 내부 단편화는 할당기가 요청보다 큰 덩어리를 내줄 때 그 덩어리 안에 쓰이지 않고 남는 낭비로, 낭비가 할당 단위 안쪽에서 생긴다는 뜻이라고 한다(PDF p.1-2). 18장(Paging: Introduction) 요약은 페이징이 메모리를 고정 크기 단위로 나누므로 설계상 외부 단편화가 생기지 않는다고 하고, 20장(Paging: Smaller Tables)은 페이지를 크게 잡으면 각 페이지 안에서 낭비가 생기는 내부 단편화가 커져 대부분의 시스템이 4KB·8KB 같은 작은 페이지를 쓴다고 설명한다.
