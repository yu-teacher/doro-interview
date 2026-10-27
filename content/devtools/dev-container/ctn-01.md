---
slug: "ctn-01"
topic: "dev-container"
tier: BASIC
difficulty: 1
title: "컨테이너 격리는 리눅스 커널의 어떤 기능으로 만들어지고, 네임스페이스는 구체적으로 무엇을 격리하나요?"
keywords: ["컨테이너는 격리된 프로세스", "namespace로 보이는 범위 분리", "pid·net·mnt·uts·ipc·user", "호스트 커널 공유", "자원 제한은 cgroup"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/", "https://docs.docker.com/get-started/docker-overview/", "https://docs.docker.com/engine/security/", "https://raw.githubusercontent.com/opencontainers/runtime-spec/main/config-linux.md"]
concepts: [container-isolation]
importance: 3
links: [{to: "ctn-02", kind: FOLLOWUP}, {to: "dkr-01", kind: RELATED}]
---
**모범 답변 (30~60초)**
컨테이너는 별도 운영체제가 아니라 리눅스 커널의 네임스페이스로 보이는 범위를 나눈 격리된 프로세스입니다. 네임스페이스는 시스템 자원 하나를 감싸서 그 안의 프로세스에게 자기만의 인스턴스처럼 보이게 하며, pid는 보이는 프로세스 목록, network는 네트워크 스택, mount는 마운트 목록, uts는 호스트명, ipc는 프로세스 간 통신 자원, user는 사용자 ID 매핑을 분리합니다. 자원 제한은 cgroup이 따로 맡습니다. 또 모든 컨테이너가 호스트와 같은 커널을 공유한다는 점이 VM과 다릅니다.

```bash
docker run -d --name a busybox:1.36 sleep 60        # 기본 컨테이너
docker run -d --name b --pid=host --network=host --uts=host --ipc=host --cgroupns=host busybox:1.36 sleep 60
docker exec a ls -l /proc/self/ns                    # 네임스페이스 inode 번호를 비교한다
docker exec b ls -l /proc/self/ns
```

(공식 문서) OCI 런타임 사양의 Linux 설정(config-linux) 문서는 네임스페이스를 시스템 전역 자원을 감싸서 그 안의 프로세스에게는 자기만의 격리된 인스턴스처럼 보이게 하는 것이라고 정의한다. 지원하는 것이 권장되는(SHOULD) 종류로 pid(같은 네임스페이스의 프로세스만 보임), network(자기 네트워크 스택), mount(격리된 마운트 테이블), ipc, uts(호스트명과 도메인명), user(호스트와 컨테이너 사이의 UID·GID 재매핑), cgroup(cgroup 계층의 격리된 뷰), time(자기 시계)을 나열하고, 설정에 적지 않은 종류는 런타임의 네임스페이스를 그대로 물려받아야 한다고 한다. Docker overview는 컨테이너를 실행하면 Docker가 그 컨테이너를 위한 네임스페이스 묶음을 만든다고 하고, security 페이지는 `docker run` 때 네임스페이스와 control group을 만들며 컨테이너 안의 프로세스는 다른 컨테이너나 호스트의 프로세스를 볼 수 없고 컨테이너마다 자기 네트워크 스택을 갖는다고, control group은 자원 계량과 제한을 맡는다고 설명한다. What is a container 페이지는 컨테이너들이 같은 커널을 공유한다고 한다.
(실험 확인) Docker Engine 29.6.1(macOS의 Docker Desktop 리눅스 VM, 커널 6.12.76-linuxkit, arm64)에서 위 두 컨테이너를 동시에 띄워 `/proc/self/ns` 를 읽었다(2026-10-27 재실행). 기본 컨테이너 a는 cgroup·ipc·mnt·net·pid·time·uts 가 `4026536xxx` 대의 자기 값이었고(예: net 4026536812, pid 4026536810), 호스트 네임스페이스를 공유한 b는 net 4026531840, pid 4026531836, uts 4026531838, ipc 4026531839, cgroup 4026531835 로 달랐다(b도 mnt·time은 자기 값이었다). 그런데 user 는 두 컨테이너 모두 `user:[4026531837]` 로 같았다. 즉 기본 설정에서는 user 네임스페이스가 분리되지 않는다(`--userns=host` 를 명시해도 같은 값). `ps` 출력은 a에서 3줄(헤더, `sleep`, `ps`), b에서 608줄(VM의 프로세스)이었다. 여기서 "호스트"는 macOS가 아니라 Docker Desktop의 리눅스 VM이다. 두 컨테이너 모두 `uname -r` 이 `6.12.76-linuxkit` 이었고(커널 공유), hostname 은 컨테이너는 컨테이너 ID, `--uts=host` 는 `docker-desktop` 이었다. `--cgroupns=host` 컨테이너의 `/proc/self/cgroup` 은 `0::/docker/<컨테이너 ID>` 로 호스트 쪽 경로가 그대로 보였다.
