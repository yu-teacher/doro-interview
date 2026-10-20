---
slug: "osm-02"
topic: "cs-os-memory"
tier: BASIC
difficulty: 1
title: "프로세스의 주소 공간은 코드, 데이터, 힙, 스택으로 어떻게 나뉘나요?"
keywords: ["코드(텍스트) 영역", "초기화 데이터와 BSS", "힙은 낮은 주소에서 확장", "스택은 높은 주소에서 사용", "매 실행마다 주소가 달라질 수 있음"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://man7.org/linux/man-pages/man5/proc_pid_maps.5.html", "https://man7.org/linux/man-pages/man2/brk.2.html", "https://man7.org/linux/man-pages/man3/malloc.3.html", "https://www.kernel.org/doc/html/latest/admin-guide/mm/concepts.html"]
concepts: [memory-layout]
importance: 3
links: [{to: "osm-03", kind: FOLLOWUP}, {to: "jv-01", kind: RELATED}]
---
**모범 답변 (30~60초)**
프로세스의 가상 주소 공간은 보통 실행 코드가 있는 텍스트 영역, 초기값이 있는 전역 변수가 있는 데이터 영역, 초기화되지 않은 전역 변수를 위한 BSS, 동적 할당을 위한 힙, 함수 호출과 지역 변수를 위한 스택으로 나뉩니다. 힙은 낮은 주소 쪽에서 필요할 때 늘려 가며 쓰고 스택은 높은 주소 쪽에서 함수 호출마다 사용하는 식으로 배치되는 것이 일반적입니다. 여기에 공유 라이브러리와 `mmap` 영역이 더해집니다. 정확한 주소는 실행할 때마다 달라질 수 있으니 순서 같은 일반 구조만 기억하면 됩니다.

(공식 문서) `/proc/pid/maps` man 페이지는 프로세스의 매핑 영역을 주소·권한·파일 경로로 보여 주며, 파일 이름 칸에 `[heap]`, `[stack]`, `[vdso]` 같은 특수 표시가 나온다고 한다. inode 칸의 0은 연결된 inode가 없는 영역이라는 뜻이고 BSS(초기화되지 않은 데이터)가 그런 예라고 하며, 같은 페이지의 예시 출력에서는 `[heap]`이 낮은 주소 쪽, `[stack]`이 높은 주소 쪽에 나온다. `brk` 페이지는 program break가 데이터 세그먼트(초기화되지 않은 데이터의 끝)의 끝을 정하고 break를 올리면 메모리가 할당된다고 한다. 커널 Concepts overview는 스택과 힙이 파일이 없는 anonymous 메모리라고 한다.
(실험 확인) macOS(Apple Silicon)에서 C 프로그램으로 주소를 찍어 보니 코드 `0x104798548`, 문자열 상수 `0x104798678`, 초기화 전역 `0x1047a0000`, 미초기화 전역 `0x1047a0010`, 작은 `malloc` `0x104e91a20`, 지역 변수(스택) `0x16b66680c` 순으로 낮은 주소에서 높은 주소로 놓였다. 같은 프로그램을 다시 실행하자 모든 영역의 주소가 바뀌었다(코드 `0x1028f0548`). 10MB `malloc`은 작은 `malloc`과 전혀 다른 영역(`0xc1e000000`)에서 나왔다.
(보충) 텍스트·데이터·BSS·힙·스택이라는 영역 구분과 "힙은 낮은 주소, 스택은 높은 주소"라는 배치는 일반적인 설명이며 OS·링커·아키텍처마다 다르다. 위 주소 값은 macOS에서 나온 값이라 Linux의 배치와 다르다.
