---
slug: "osp-08"
topic: "cs-os-process"
tier: DEEP
difficulty: 2
title: "좀비 프로세스와 고아 프로세스는 무엇이고, 어떻게 처리하나요?"
keywords: ["종료했지만 wait되지 않은 자식", "종료 상태 보존", "waitpid로 회수", "init이 입양", "SIGCHLD 무시"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://man7.org/linux/man-pages/man2/wait.2.html", "https://man7.org/linux/man-pages/man2/getppid.2.html", "https://pubs.opengroup.org/onlinepubs/9799919799/functions/wait.html", "https://pubs.opengroup.org/onlinepubs/9799919799/basedefs/V1_chap03.html", "https://pubs.opengroup.org/onlinepubs/9799919799/functions/sigaction.html"]
---
**모범 답변 (30~60초)**
좀비는 이미 종료했지만 부모가 wait하지 않아서 종료 상태 같은 최소 정보만 남아 있는 자식 프로세스입니다. 부모가 waitpid로 상태를 읽어 가야 사라지고, 쌓이면 프로세스 테이블 슬롯을 차지해서 더 이상 프로세스를 못 만들 수 있습니다. 고아는 반대로 부모가 먼저 종료했지만 자식은 살아 있는 경우로, 리눅스에서는 init이나 가장 가까운 subreaper가 새 부모가 되어 이후 대신 wait로 정리해 줍니다. 부모가 SIGCHLD를 SIG_IGN으로 두면(Linux 2.6 이상) 자식이 좀비가 되지 않게 할 수도 있습니다.

(공식 문서) wait(2) NOTES는 종료했지만 wait되지 않은 자식이 좀비가 되고, 커널이 PID·종료 상태·자원 사용 정보를 보관하며, 회수되지 않으면 프로세스 테이블 슬롯을 차지해 새 프로세스를 못 만들 수 있다고 한다. 부모가 종료하면 좀비 자식은 init(또는 PR_SET_CHILD_SUBREAPER로 정한 가장 가까운 subreaper)에 입양되고 init이 자동으로 wait한다고 하며, SIGCHLD 처분을 SIG_IGN으로 하거나 SA_NOCLDWAIT를 켜면 종료한 자식이 좀비가 되지 않고 wait는 모든 자식이 끝날 때까지 블록된 뒤 ECHILD로 실패한다고 한다(POSIX.1-2001이 규정, Linux 2.6은 따르고 Linux 2.4 이하는 따르지 않음). getppid(2)는 부모가 이미 종료했으면 init이나 subreaper로 재지정된다고 한다. POSIX wait 문서는 wait·waitpid가 자식의 상태 정보를 소비한다고 하고 SA_NOCLDWAIT나 SIGCHLD의 SIG_IGN 상태에서는 자식 종료가 대기 중인 wait에 상태를 주지 않는다고 하며, POSIX 정의 3.426은 좀비를 종료 후 부모가 상태 정보를 소비하기 전의 프로세스로 정의한다.
(실험 확인) macOS 26.6.2(Darwin 25.6.0), Apple M5 Pro, Apple clang 21. 자식이 종료한 뒤 wait하지 않고 1초 기다린 시점의 ps는 stat Z와 defunct를 보여 줬고, waitpid가 종료 코드 7을 돌려준 뒤에는 ps 결과가 비었다. SIGCHLD를 SIG_IGN으로 둔 경우에는 자식 종료 후에도 좀비가 보이지 않았고 waitpid가 -1(ECHILD, macOS에서 errno 10)로 실패했다. 부모가 먼저 종료하면 자식의 getppid()가 부모 PID에서 1로 바뀌었다. macOS에서 1번 프로세스는 launchd이고, 이 결과가 리눅스의 init/subreaper 동작을 직접 확인한 것은 아니다.
(보충) 고아 프로세스(부모가 먼저 종료했지만 자식은 살아 있는 프로세스)라는 용어와 정의는 일반적인 설명이다. wait(2)는 좀비 자식의 입양을, getppid(2)는 부모 종료 후의 재지정을 적을 뿐 이 용어를 정의하지 않고, POSIX의 Orphaned Process Group(3.247)은 프로세스 그룹에 대한 다른 개념이다.
