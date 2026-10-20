---
slug: "osm-09"
topic: "cs-os-memory"
tier: DEEP
difficulty: 2
title: "페이지 폴트는 언제 발생하고 커널은 어떻게 처리하나요? 요구 페이징과는 어떤 관계인가요?"
keywords: ["변환 실패 시 예외 발생", "커널 폴트 핸들러", "요구 페이징(지연 할당)", "마이너 폴트와 메이저 폴트", "허용되지 않은 접근은 SIGSEGV"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.kernel.org/doc/html/latest/mm/page_tables.html", "https://www.kernel.org/doc/html/latest/admin-guide/mm/concepts.html", "https://man7.org/linux/man-pages/man2/getrusage.2.html"]
concepts: [virtual-memory]
importance: 2
links: [{to: "osm-10", kind: FOLLOWUP}, {to: "osm-18", kind: FOLLOWUP}, {to: "osm-19", kind: FOLLOWUP}, {to: "osm-11", kind: RELATED}]
---
**모범 답변 (30~60초)**
페이지 폴트는 MMU가 가상 주소의 변환을 찾지 못하거나 접근 권한이 맞지 않을 때 CPU가 현재 실행을 멈추고 커널의 핸들러를 실행하게 하는 예외입니다. 지연 할당, copy-on-write, 스왑아웃처럼 정상적인 원인이 있어서, 접근이 허용된 주소라면 커널이 물리 페이지를 할당하거나 저장 장치에서 읽어 와 페이지 테이블을 고치고 실행을 이어 갑니다. 이렇게 실제로 접근할 때 페이지를 올리는 것이 요구 페이징입니다. 디스크 I/O 없이 끝나는 폴트를 마이너, I/O가 필요한 폴트를 메이저라고 부르며, 허용되지 않은 주소를 건드리면 SIGSEGV가 갑니다.

(공식 문서) page_tables 문서는 MMU가 변환을 찾지 못하거나 접근 권한이 없으면 page fault 예외가 일어나 CPU가 현재 실행을 멈추고 특별한 함수를 실행한다고 한다. 지연 할당(lazy allocation)과 copy-on-write, 스왑아웃된 페이지가 정상적인 원인이며, 사용자 영역에서 허용되지 않는 접근은 SIGSEGV로 이어지고, 핸들러는 아키텍처별 진입점을 거쳐 `handle_mm_fault()`에서 일을 하고 마지막에 `do_read_fault()`, `do_cow_fault()`, `do_shared_fault()` 중 하나를 부른다고 한다. Concepts overview는 anonymous 메모리가 처음에는 영역만 정의하고 읽기는 0으로 채워진 특수 페이지를 가리키며 쓰기 때 실제 페이지가 할당된다고 한다. `getrusage`는 `ru_minflt`를 I/O 없이 처리된 폴트(페이지 프레임 재사용 예를 든다), `ru_majflt`를 I/O가 필요한 폴트로 정의한다.
(실험 확인) macOS(Apple Silicon, 페이지 16KB)에서 `mmap`으로 32MB(2,048페이지) anonymous 영역을 만든 직후 폴트 증가량은 0이었고, 페이지마다 1바이트씩 쓰자 `ru_minflt`가 정확히 2,048 늘었으며 같은 곳을 다시 쓰면 0이었다. 지연 할당이 실제로 접근할 때 일어남을 보여 주며, 폴트 처리 경로 세부는 OS마다 다르다.
(보충) 폴트 처리를 마치면 같은 명령을 다시 실행한다는 설명과 "요구 페이징은 접근 시점에 페이지를 올리는 방식"이라는 용어 정리는 일반 설명이다. 또 `getrusage` 정의는 마이너 폴트를 페이지 프레임 재사용으로 예시할 뿐, 0으로 채운 새 페이지를 받는 폴트가 마이너로 집계되는지는 문서에 없고 위 macOS 실험에서 그렇게 집계되었다는 사실만 확인했다.
