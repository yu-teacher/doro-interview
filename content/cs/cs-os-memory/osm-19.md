---
slug: "osm-19"
topic: "cs-os-memory"
tier: TRICKY
difficulty: 3
title: "malloc이 성공했는데도 나중에 프로세스가 메모리 부족으로 죽을 수 있는 이유는 무엇인가요?"
keywords: ["malloc 성공이 메모리 보장은 아님", "지연 할당", "오버커밋 정책", "사용 시점에 물리 페이지 부족", "OOM killer"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://man7.org/linux/man-pages/man3/malloc.3.html", "https://www.kernel.org/doc/html/latest/mm/overcommit-accounting.html", "https://www.kernel.org/doc/html/latest/admin-guide/mm/concepts.html", "https://pages.cs.wisc.edu/~remzi/OSTEP/"]
refs: ["OSTEP, 23장 Complete Virtual Memory Systems(Other Neat Tricks: demand zeroing), PDF p.7", "OSTEP, 22장 Beyond Physical Memory: Policies(22.11 Thrashing), PDF p.14"]
concepts: [virtual-memory, memory-layout]
importance: 1
links: [{to: "dkr-20", kind: RELATED}]
---
**모범 답변 (30~60초)**
Linux에서 `malloc`이 성공했다는 것은 가상 주소 공간을 예약했다는 뜻이지 그만큼의 물리 메모리가 확보됐다는 뜻이 아닙니다. 물리 페이지는 처음 접근할 때 폴트로 할당되는 지연 할당이고, 기본 오버커밋 정책은 터무니없는 요청만 거절하는 휴리스틱입니다. 그래서 여러 프로세스가 모두 받은 만큼 실제로 쓰기 시작하면 물리 메모리가 모자라고, 커널이 회수하다 안 되면 OOM killer로 프로세스를 죽입니다. 정책을 2로 바꾸면 커밋 한도를 넘는 할당을 미리 거절해 접근 중에 죽는 일을 줄이는 대신 할당 단계에서 실패를 받습니다.

(공식 문서) `malloc(3)`은 Linux에서 `malloc()`이 NULL이 아니어도 메모리가 실제로 사용 가능하다는 보장이 없고, 메모리가 부족하면 OOM killer가 프로세스를 죽일 수 있다고 한다. 커널 Overcommit Accounting은 모드 0(기본)을 명백한 과다 요청만 거절하는 휴리스틱, 1을 항상 허용, 2를 커밋 총량을 스왑과 물리 메모리의 설정 비율로 제한하는 것으로 설명하고, 모드 2에서는 접근 중에 죽지 않고 할당 시 오류를 받는다고 한다. Concepts overview는 anonymous 메모리가 영역만 정의하고 쓰기 때 실제 페이지가 할당된다고 한다.
(실험 확인) macOS(RAM 24GB, Apple Silicon)에서 최적화를 끄고 컴파일해(켜면 컴파일러가 쓰지 않는 `malloc`을 없애 결과가 달라진다) `malloc` 8GB와 16GB가 모두 성공했고, 8GB 할당 직후 최대 상주 메모리(maxrss)는 1MB였다. 그중 256MB를 채우자 maxrss가 257MB가 되었고, 16GB 중 한 바이트만 쓰면 페이지 폴트가 1번 늘었다. 지연 할당 자체는 확인했지만 macOS는 Linux의 오버커밋·OOM killer 정책과 다르므로 OOM killer 동작은 실행해 확인하지 못했다.
(원저자 자료) OSTEP 23장(Complete Virtual Memory Systems, Other Neat Tricks, PDF p.7)은 demand zeroing을 힙에 페이지를 추가하라는 요청에 곧바로 물리 페이지를 찾아 0으로 채워 연결하지 않고, 접근 불가로 표시한 페이지 테이블 항목만 넣어 두었다가 실제로 읽거나 쓰는 순간 trap에서 물리 페이지를 찾아 0으로 채워 연결하는 지연 기법이라고 설명한다. 22장(22.11, PDF p.14)은 실행 중인 프로세스들이 요구하는 메모리 총합이 물리 메모리를 넘으면 시스템이 계속 페이징하게 되고, 그럴 때 일부 Linux는 OOM killer로 메모리를 많이 쓰는 프로세스를 죽인다고 하므로 여러 프로세스가 동시에 쓰면 모자라진다는 시나리오가 뒷받침된다.
(보충) 오버커밋 정책 2의 장단점 요약은 OSTEP에서 확인하지 못했다.
