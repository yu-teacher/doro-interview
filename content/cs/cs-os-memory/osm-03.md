---
slug: "osm-03"
topic: "cs-os-memory"
tier: BASIC
difficulty: 1
title: "스택과 힙은 무엇이 다르고, 각각 어떤 경우에 문제가 되나요?"
keywords: ["함수 호출 프레임 자동 관리", "힙은 명시적 할당과 해제", "스택 크기 제한", "스택 오버플로", "힙 누수·단편화"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://man7.org/linux/man-pages/man2/getrlimit.2.html", "https://man7.org/linux/man-pages/man3/malloc.3.html", "https://man7.org/linux/man-pages/man2/brk.2.html"]
---
**모범 답변 (30~60초)**
스택은 함수가 호출될 때 지역 변수와 복귀 정보를 담은 프레임이 쌓이고 함수가 끝나면 자동으로 없어지는 영역이고, 힙은 프로그램이 `malloc`이나 `new`로 직접 요청해서 쓰고 직접 해제하는 영역입니다. 스택은 할당과 해제가 호출과 반환에 묶여 있어 빠르고 단순하지만 크기 상한이 정해져 있어 재귀가 너무 깊거나 큰 지역 배열을 두면 스택 오버플로가 납니다. 힙은 수명을 자유롭게 정할 수 있는 대신 해제를 잊으면 누수가 되고, 할당과 해제를 반복하면 단편화가 생길 수 있습니다.

(공식 문서) `getrlimit` man 페이지는 `RLIMIT_STACK`이 프로세스 스택의 최대 크기이고, 이 한도에 도달하면 SIGSEGV가 발생하며 이를 처리하려면 대체 시그널 스택이 필요하다고 한다. `malloc` 페이지는 glibc의 `malloc`이 보통 힙에서 `sbrk`로 크기를 조절하며 할당하고, 128kB(기본값, `mallopt`로 조절 가능)보다 큰 블록은 `mmap`으로 만든 private anonymous 매핑에서 가져온다고 한다.
(실험 확인) macOS(Apple Silicon)에서 최적화를 끄고(`-O0`) 컴파일했다. `ulimit -s`는 8176(KB)이었고, 프레임에 1KB 지역 배열을 둔 재귀 함수는 깊이 7,688에서 SIGSEGV로 끝났다(대체 시그널 스택을 두고 잡아서 확인). 같은 머신에서 힙에 200MB를 `malloc`하고 채우는 것은 문제없이 성공했다. 스택 한도 8MB 근처에서 실패하는 것과 힙은 훨씬 큰 크기를 받는 것의 차이를 보여 준다. `-O1`로 컴파일하면 깊이가 261,439까지 늘어났으므로(컴파일러가 거의 쓰지 않는 배열을 줄인 것으로 보인다) 이 깊이 값은 컴파일 옵션에 의존한다.
(보충) 프레임 구성, 스택이 빠르고 단순하다는 설명, 해제 시 단편화 같은 일반 설명은 공식 출처에 직접 서술되어 있지 않다. 스택 한도 값과 `malloc` 구현은 OS·설정에 따라 다르다.
