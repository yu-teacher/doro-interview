---
slug: "osm-18"
topic: "cs-os-memory"
tier: TRICKY
difficulty: 2
title: "fork()로 프로세스를 복제하면 메모리를 전부 복사하나요? copy-on-write는 어떻게 동작하나요?"
keywords: ["페이지 테이블 복제", "쓰기 시점에 페이지 복사", "부모와 자식의 격리 유지", "fork 비용은 페이지 테이블 복제 수준", "쓰기 비용은 나중에 지불"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://pubs.opengroup.org/onlinepubs/9799919799/functions/fork.html", "https://man7.org/linux/man-pages/man2/fork.2.html", "https://www.kernel.org/doc/html/latest/mm/page_tables.html", "https://pages.cs.wisc.edu/~remzi/OSTEP/"]
refs: ["OSTEP, 23장 Complete Virtual Memory Systems(Other Neat Tricks: demand zeroing, copy-on-write), PDF p.7-8"]
concepts: [virtual-memory, process-management]
importance: 2
links: [{to: "osm-09", kind: PREREQ}, {to: "osp-04", kind: RELATED}]
---
**모범 답변 (30~60초)**
`fork()`는 자식을 부모의 정확한 복사본으로 만들지만 메모리를 그 자리에서 전부 복사하지는 않습니다. Linux에서는 copy-on-write로 구현되어, 부모의 페이지 테이블과 자식용 태스크 구조만 복제하고 물리 페이지는 부모와 자식이 공유합니다. 누군가 공유 페이지에 쓰려고 하면 그때 페이지 폴트가 나서 커널이 그 페이지만 복사해 쓰는 쪽에 주고, 그래서 서로의 쓰기는 상대에게 보이지 않습니다. 따라서 `fork` 자체의 비용은 페이지 테이블 복제 수준이라 비교적 빠르고, 복사 비용은 쓰기가 일어난 페이지만큼 나중에 나눠서 냅니다.

(공식 문서) POSIX `fork`는 자식이 부모의 정확한 복사본이고 `MAP_PRIVATE` 매핑도 `MAP_PRIVATE`로 이어받으며, `fork` 전에 부모가 그 매핑에 한 변경은 자식에게 보이고 `fork` 뒤의 변경은 한 쪽 프로세스에만 보인다고 한다. Linux `fork(2)`는 두 프로세스가 별도 메모리 공간에서 실행되고 한쪽의 쓰기가 상대에게 영향을 주지 않으며, Linux는 copy-on-write 페이지로 구현해서 부모의 페이지 테이블을 복제하고 자식의 태스크 구조를 만드는 시간과 메모리만 비용이라고 한다. 커널 page_tables 문서는 copy-on-write를 page fault의 정상적인 원인으로 들며 `do_cow_fault()` 경로를 언급한다.
(실험 확인) macOS(Apple Silicon)에서 2GB를 건드린 뒤 `fork()`를 호출하는 시간은 약 0.22ms로 힙이 작을 때(약 0.32ms)와 비슷했다. `fork` 뒤 자식이 4KB마다 1바이트씩 2GB 전체에 쓰는 데 약 410ms 걸렸고, 같은 쓰기를 `fork` 없이 부모가 하면 약 140ms였다. 자식이 쓴 값은 부모에게 보이지 않았다(`p[0]`이 'B'로 바뀌는 자식 실험에서 부모는 'A'). 자식이 읽기만 해도 폴트가 2,048번 발생했는데, 이는 macOS 구현이 Linux 서술과 다를 수 있음을 뜻하므로 "읽기는 폴트가 없다"고는 확인하지 못했다.
(원저자 자료) OSTEP 23장(Complete Virtual Memory Systems, Other Neat Tricks, PDF p.7-8)은 copy-on-write를 한 주소 공간에서 다른 곳으로 페이지를 복사해야 할 때 복사하지 않고 대상 주소 공간에 매핑하되 양쪽 모두에서 읽기 전용으로 표시하는 최적화로 설명한다. 양쪽이 읽기만 하면 아무 일도 안 일어나 데이터 이동 없이 빠른 복사가 되고, 한쪽이 쓰려 하면 운영체제로 trap이 걸려 COW 페이지임을 알아보고 새 페이지를 할당해 내용을 채운 뒤 쓰려던 프로세스의 주소 공간에 연결해 그 프로세스가 사유 복사본을 갖게 한다. 이 장은 UNIX에서 `fork`가 호출자 주소 공간의 정확한 복사본을 만들어야 하는데 그 대부분이 곧이어 `exec`로 덮어써지므로, COW `fork`가 불필요한 복사를 피한다고 설명한다.
(보충) 매우 큰 프로세스에서 `fork`의 페이지 테이블 복제 비용이 무시할 수준은 아니라는 점은 OSTEP에서 확인하지 못했다.
