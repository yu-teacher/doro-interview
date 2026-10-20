---
slug: "osm-13"
topic: "cs-os-memory"
tier: DEEP
difficulty: 2
title: "write()가 성공하면 데이터는 디스크에 안전하게 저장된 건가요? 페이지 캐시와 fsync의 관계를 설명해 주세요."
keywords: ["write는 페이지 캐시에 기록", "dirty 페이지는 나중에 플러시", "fsync는 저장 장치로 전송", "fsync는 완료까지 블록", "디렉터리 항목은 별도 fsync"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://pubs.opengroup.org/onlinepubs/9799919799/basedefs/V1_chap04.html", "https://pubs.opengroup.org/onlinepubs/9799919799/functions/fsync.html", "https://man7.org/linux/man-pages/man2/fsync.2.html", "https://www.kernel.org/doc/html/latest/admin-guide/mm/concepts.html", "https://www.kernel.org/doc/html/latest/admin-guide/sysctl/vm.html"]
concepts: [io-filesystem]
importance: 2
links: [{to: "cch-10", kind: RELATED}]
---
**모범 답변 (30~60초)**
아닙니다. 파일에 쓴 데이터는 먼저 커널의 페이지 캐시에 올라가 dirty 페이지로 표시되고, 나중에 커널 플러셔 스레드가 장치에 내려 씁니다. 그래서 `write`가 성공해도 그 시점에 정전이 나면 데이터가 사라질 수 있습니다. 저장을 확실히 하고 싶으면 `fsync`를 호출해야 하는데, 이 호출은 해당 파일의 변경 데이터를 저장 장치로 전송하고 완료될 때까지 돌아오지 않습니다. 새 파일을 만든 경우 디렉터리 항목까지 보장하려면 디렉터리에도 `fsync`가 필요할 수 있습니다. 그리고 `fsync`가 정확히 무엇을 보장하는지는 구현에 따라 다릅니다.

(공식 문서) POSIX XBD 4.11 File System Cache는 캐시 항목이 `fsync` 등의 성공적 호출 결과로 저장 장치에 전달되어야 하고 그 외 시점에도 자동으로 전달될 수 있으며, 크래시 전에 다 전달되지 못하면 뒤쪽 연산 결과만 남고 앞쪽 효과는 빠질 수 있다고 밝힌다. POSIX `fsync`는 전송의 성격이 구현 정의라고 하고 완료되거나 오류가 날 때까지 돌아오지 않는다고 한다. Linux `fsync(2)`는 수정된 버퍼 캐시 페이지와 메타데이터를 디스크에 내리고 디스크 캐시가 있으면 이것도 비우며 장치가 완료를 알릴 때까지 블록하고, 디렉터리 항목이 디스크에 닿았다고 보장하려면 디렉터리 fd에 별도 `fsync`가 필요하다고 한다. 커널 Concepts overview는 쓰기가 페이지 캐시에 들어가 dirty로 표시되고 결국 저장 장치로 간다고 하며, sysctl 문서는 `vm.dirty_expire_centisecs`가 dirty 데이터가 플러셔 스레드의 기록 대상이 되는 나이를, `vm.dirty_writeback_centisecs`가 플러셔 스레드가 깨어나는 주기를 정한다고 설명한다.
(실험 확인) macOS(Apple Silicon)에서 64MB를 `write`하는 데 약 9ms였고, 직후 `fsync`는 약 0.7ms, 변경이 없을 때의 `fsync`는 거의 0이었다. 4KB 쓰기와 `fsync` 반복은 회당 약 0.06ms였지만 같은 반복을 `fcntl(F_FULLFSYNC)`로 바꾸면 회당 약 3.3ms였다. 이 측정은 macOS에서의 결과이며 Linux `fsync`의 비용·동작과 같다고 볼 수 없다.
(보충) 위 측정에서 두 호출의 비용이 크게 다른 이유는 확인하지 못했다. `F_FULLFSYNC`는 이번에 읽은 공식 문서가 다루지 않는 Apple 전용 호출이라 측정 사실만 적었다. "정전이 나면 사라질 수 있다"는 표현은 POSIX의 크래시 서술을 풀어 쓴 일반 설명이다.
