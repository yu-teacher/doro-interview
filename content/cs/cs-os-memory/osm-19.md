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
sources: ["https://man7.org/linux/man-pages/man3/malloc.3.html", "https://www.kernel.org/doc/html/latest/mm/overcommit-accounting.html", "https://www.kernel.org/doc/html/latest/admin-guide/mm/concepts.html"]
---
**모범 답변 (30~60초)**
Linux에서 `malloc`이 성공했다는 것은 가상 주소 공간을 예약했다는 뜻이지 그만큼의 물리 메모리가 확보됐다는 뜻이 아닙니다. 물리 페이지는 처음 접근할 때 폴트로 할당되는 지연 할당이고, 기본 오버커밋 정책은 터무니없는 요청만 거절하는 휴리스틱입니다. 그래서 여러 프로세스가 모두 받은 만큼 실제로 쓰기 시작하면 물리 메모리가 모자라고, 커널이 회수하다 안 되면 OOM killer로 프로세스를 죽입니다. 정책을 2로 바꾸면 커밋 한도를 넘는 할당을 미리 거절해 접근 중에 죽는 일을 줄이는 대신 할당 단계에서 실패를 받습니다.

(공식 문서) `malloc(3)`은 Linux에서 `malloc()`이 NULL이 아니어도 메모리가 실제로 사용 가능하다는 보장이 없고, 메모리가 부족하면 OOM killer가 프로세스를 죽일 수 있다고 한다. 커널 Overcommit Accounting은 모드 0(기본)을 명백한 과다 요청만 거절하는 휴리스틱, 1을 항상 허용, 2를 커밋 총량을 스왑과 물리 메모리의 설정 비율로 제한하는 것으로 설명하고, 모드 2에서는 접근 중에 죽지 않고 할당 시 오류를 받는다고 한다. Concepts overview는 anonymous 메모리가 영역만 정의하고 쓰기 때 실제 페이지가 할당된다고 한다.
(실험 확인) macOS(RAM 24GB, Apple Silicon)에서 최적화를 끄고 컴파일해(켜면 컴파일러가 쓰지 않는 `malloc`을 없애 결과가 달라진다) `malloc` 8GB와 16GB가 모두 성공했고, 8GB 할당 직후 최대 상주 메모리(maxrss)는 1MB였다. 그중 256MB를 채우자 maxrss가 257MB가 되었고, 16GB 중 한 바이트만 쓰면 페이지 폴트가 1번 늘었다. 지연 할당 자체는 확인했지만 macOS는 Linux의 오버커밋·OOM killer 정책과 다르므로 OOM killer 동작은 실행해 확인하지 못했다.
(보충) 여러 프로세스가 동시에 쓰면 부족해진다는 시나리오와 정책 2의 장단점 요약은 위 문서를 바탕으로 한 일반 설명이다.
