---
slug: "osm-03"
topic: "cs-os-memory"
tier: BASIC
difficulty: 1
title: "스택과 힙은 무엇이 다르고, 각각 어떤 경우에 문제가 되나요?"
keywords: ["함수 호출 프레임 자동 관리", "힙은 명시적 할당과 해제", "스택 크기 제한", "스택 오버플로", "힙 누수·단편화"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://man7.org/linux/man-pages/man2/getrlimit.2.html", "https://man7.org/linux/man-pages/man3/malloc.3.html", "https://man7.org/linux/man-pages/man2/brk.2.html", "https://pages.cs.wisc.edu/~remzi/OSTEP/"]
refs: ["OSTEP, 14장 Interlude: Memory API(14.1 Types of Memory, 14.3 The free() Call), PDF p.1-2, 4", "OSTEP, 13장 The Abstraction: Address Spaces(13.3), PDF p.3", "OSTEP, 17장 Free-Space Management(도입, 17.1 Assumptions), PDF p.1-2"]
concepts: [memory-layout]
importance: 3
links: [{to: "jv-02", kind: RELATED}, {to: "jv-07", kind: RELATED}]
---
**모범 답변 (30~60초)**
스택은 함수가 호출될 때 지역 변수와 복귀 정보를 담은 프레임이 쌓이고 함수가 끝나면 자동으로 없어지는 영역이고, 힙은 프로그램이 `malloc`이나 `new`로 직접 요청해서 쓰고 직접 해제하는 영역입니다. 스택은 할당과 해제가 호출과 반환에 묶여 있어 빠르고 단순하지만 크기 상한이 정해져 있어 재귀가 너무 깊거나 큰 지역 배열을 두면 스택 오버플로가 납니다. 힙은 수명을 자유롭게 정할 수 있는 대신 해제를 잊으면 누수가 되고, 할당과 해제를 반복하면 단편화가 생길 수 있습니다.

(공식 문서) `getrlimit` man 페이지는 `RLIMIT_STACK`이 프로세스 스택의 최대 크기이고, 이 한도에 도달하면 SIGSEGV가 발생하며 이를 처리하려면 대체 시그널 스택이 필요하다고 한다. `malloc` 페이지는 glibc의 `malloc`이 보통 힙에서 `sbrk`로 크기를 조절하며 할당하고, 128kB(기본값, `mallopt`로 조절 가능)보다 큰 블록은 `mmap`으로 만든 private anonymous 매핑에서 가져온다고 한다.
(실험 확인) macOS(Apple Silicon)에서 최적화를 끄고(`-O0`) 컴파일했다. `ulimit -s`는 8176(KB)이었고, 프레임에 1KB 지역 배열을 둔 재귀 함수는 깊이 7,688에서 SIGSEGV로 끝났다(대체 시그널 스택을 두고 잡아서 확인). 같은 머신에서 힙에 200MB를 `malloc`하고 채우는 것은 문제없이 성공했다. 스택 한도 8MB 근처에서 실패하는 것과 힙은 훨씬 큰 크기를 받는 것의 차이를 보여 준다. `-O1`로 컴파일하면 깊이가 261,439까지 늘어났으므로(컴파일러가 거의 쓰지 않는 배열을 줄인 것으로 보인다) 이 깊이 값은 컴파일 옵션에 의존한다.
(원저자 자료) OSTEP 14장(Interlude: Memory API, 14.1·14.3)은 C 프로그램의 메모리를 둘로 나눠, 스택은 컴파일러가 함수 호출 때 자리를 만들고 반환 때 해제하는 자동 메모리이며 그래서 호출보다 오래 살아야 할 정보를 스택에 두면 안 된다고 한다. 힙은 할당과 해제를 프로그래머가 명시적으로 하는 메모리로 수명을 길게 가져갈 수 있지만 많은 버그의 원인이라고 하고, `free`에는 크기를 넘기지 않으므로 할당 라이브러리가 크기를 스스로 추적해야 한다고 한다. 13장은 스택이 함수 호출 사슬, 지역 변수, 인자, 반환값을 담는다고 설명한다. 17장(Free-Space Management, PDF p.1-2)은 `malloc`/`free`처럼 가변 크기를 다루는 할당기에서 빈 공간이 여러 조각으로 쪼개져 총량은 충분해도 큰 요청이 실패하는 외부 단편화가 생긴다고 설명하고, 한번 내준 메모리는 다른 곳으로 옮길 수 없다고 가정하므로 이 논의에서는 빈 공간 압축이 불가능하다고 둔다.
(보충) 스택이 힙보다 빠르고 단순하다는 설명은 OSTEP에서 직접 확인하지 못했다. 스택 한도 값과 `malloc` 구현은 OS·설정에 따라 다르다.
