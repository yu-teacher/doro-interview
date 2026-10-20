---
slug: "osm-20"
topic: "cs-os-memory"
tier: TRICKY
difficulty: 3
title: "mmap으로 매핑한 파일 영역에서 파일 끝을 넘어 접근하거나 파일 크기가 줄어들면 어떻게 되나요?"
keywords: ["페이지 단위 매핑", "마지막 페이지 나머지는 0", "파일 끝 뒤의 페이지 접근은 SIGBUS", "범위 밖 쓰기는 파일을 늘리지 않음", "크기 변경 시 동작은 unspecified"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://pubs.opengroup.org/onlinepubs/9799919799/functions/mmap.html", "https://man7.org/linux/man-pages/man2/mmap.2.html"]
concepts: [virtual-memory, io-filesystem]
importance: 1
---
**모범 답변 (30~60초)**
파일은 페이지 단위로 매핑되므로 파일 크기가 페이지의 배수가 아니면 마지막 페이지의 남는 부분은 0으로 채워진 채 읽히고, 그 부분을 고쳐도 파일에는 쓰이지 않습니다. 반면 파일 끝이 속한 페이지를 지난 매핑 구간에 접근하면 SIGBUS 시그널을 받습니다. 매핑한 뒤 파일 크기가 바뀔 때 추가되거나 잘려 나간 부분을 접근하면 어떻게 되는지는 명세가 정하지 않으며, 구현에 따라 줄어든 뒤 접근에서 SIGBUS가 날 수 있습니다. 파일 끝을 넘어 쓴다고 파일이 늘어나지 않고 크기는 `ftruncate`로 직접 바꿔야 합니다.

(공식 문서) POSIX `mmap`(DESCRIPTION)은 객체 끝의 부분 페이지를 항상 0으로 채우고 그 끝을 넘는 수정 부분은 쓰지 않으며, 객체 끝 뒤의 온전한 페이지를 참조하면 SIGBUS가 전달된다고 한다. 매핑 뒤 파일 크기가 바뀌면 추가·제거된 부분에 대한 참조 효과는 unspecified라고 하고, RATIONALE은 다른 프로세스가 객체 크기를 언제든 바꿀 수 있다는 점을 근거로 들며, 범위 밖 참조는 객체를 확장하지 않고 크기는 `ftruncate()`로 직접 바꿀 수 있다고 한다. Linux `mmap(2)`도 매핑 파일 끝 너머 페이지 접근의 SIGBUS와 부분 페이지 0 채움을 같은 취지로 설명하고(NOTES·ERRORS), 크기 변경의 효과는 unspecified라고 한다.
(실험 확인) macOS(Apple Silicon, 페이지 16KB)에서 11바이트 파일을 한 페이지 매핑하자 파일 끝 뒤 바이트(`s[11]`, `s[16383]`)는 0이었고, `s[20]`에 써도 파일 크기는 11 그대로였다. 같은 파일을 2페이지로 매핑해 둘째 페이지를 읽자 SIGBUS(10번)였다. 2페이지 파일을 매핑한 뒤 `ftruncate`로 반 페이지로 줄이자 둘째 페이지 접근은 SIGBUS였고, 줄어든 크기 안의 `p[10]`은 읽혔으며 같은 페이지의 새 파일 끝 뒤 위치는 0이었다. 1페이지 파일을 2페이지로 매핑하고 `ftruncate`로 2페이지로 키우자 이전에 SIGBUS가 나던 둘째 페이지에 쓸 수 있었고 파일 크기는 32768이 되었다. `mmap(len=1)`로 만든 anonymous 영역은 페이지 끝까지 쓸 수 있었고 그다음 페이지는 SIGSEGV였다.
