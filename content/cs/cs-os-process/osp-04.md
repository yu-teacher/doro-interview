---
slug: "osp-04"
topic: "cs-os-process"
tier: BASIC
difficulty: 2
title: "fork()와 exec()는 각각 무엇을 하고, 왜 둘로 나뉘어 있나요?"
keywords: ["fork는 프로세스 복제", "자식은 0, 부모는 자식 PID", "exec는 프로세스 이미지 교체", "PID 유지", "FD_CLOEXEC"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://pubs.opengroup.org/onlinepubs/9799919799/functions/fork.html", "https://pubs.opengroup.org/onlinepubs/9799919799/functions/exec.html", "https://man7.org/linux/man-pages/man2/fork.2.html", "https://man7.org/linux/man-pages/man2/execve.2.html"]
concepts: [process-management]
importance: 2
links: [{to: "osp-08", kind: FOLLOWUP}, {to: "osp-16", kind: FOLLOWUP}, {to: "osm-18", kind: RELATED}]
---
**모범 답변 (30~60초)**
fork는 호출한 프로세스를 복제해 새 프로세스를 만듭니다. 자식은 부모 주소 공간의 복사본과 열린 파일 디스크립터를 이어받고, fork의 반환값은 자식에서는 0, 부모에서는 자식의 PID입니다. exec 계열은 새 프로세스를 만들지 않고 현재 프로세스의 이미지를 다른 프로그램으로 통째로 바꾸며, 성공하면 돌아오지 않습니다. PID는 그대로이고 FD_CLOEXEC가 없는 파일 디스크립터는 열린 채 유지됩니다. 둘이 나뉘어 있어서 fork와 exec 사이에 자식에서 리다이렉션 같은 설정을 할 수 있습니다.

(공식 문서) POSIX fork는 자식이 호출 프로세스의 복사본이되 고유한 프로세스 ID를 갖고, 부모 프로세스 ID가 호출 프로세스의 ID이며, FD_CLOFORK가 설정된 것을 뺀 파일 디스크립터의 복사본이 부모와 같은 open file description을 가리킨다고 한다. 반환값은 자식에서 0, 부모에서 자식의 프로세스 ID이다. POSIX exec는 현재 프로세스 이미지를 새 이미지로 대체하고 성공하면 반환하지 않으며, FD_CLOEXEC가 설정되지 않은 파일 디스크립터는 새 이미지에서도 열려 있고 프로세스 ID와 부모 프로세스 ID가 유지된다고 한다. fork(2)는 리눅스 fork가 copy-on-write 페이지로 구현되어 페이지 테이블 복제와 자식의 task 구조 생성 비용만 든다고 설명한다.
(실험 확인) macOS 26.6.2(Darwin 25.6.0), Apple M5 Pro, Apple clang 21. fork 후 exec한 자식은 새 PID에 부모 PID가 원래 프로세스였고(exec 전후로 같은 PID), exec만 호출한 경우에는 PID와 부모 PID가 exec 전과 같았다. exec한 새 이미지에서 일반 파일 디스크립터(3번)는 열려 있었고 O_CLOEXEC로 연 것(4번)은 닫혀 있었다. PID 숫자는 실행마다 달라진다.
(보충) 둘로 나뉜 이유가 fork와 exec 사이의 자식 설정(파일 디스크립터 재연결 등)을 가능하게 하기 위해서라는 설명은 일반적인 설계 이유 설명이며, 읽은 문서가 이 목적을 밝히지는 않는다.
