---
slug: "ctn-02"
topic: "dev-container"
tier: BASIC
difficulty: 1
title: "cgroup(컨트롤 그룹)은 무엇이고, 네임스페이스와는 역할이 어떻게 다른가요?"
keywords: ["cgroup은 자원 사용량 제한과 계량", "namespace는 보이는 범위 격리", "memory·cpu·pids 컨트롤러", "컨테이너마다 cgroup 생성", "한도는 커널이 강제"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.docker.com/engine/security/", "https://raw.githubusercontent.com/opencontainers/runtime-spec/main/config-linux.md", "https://kubernetes.io/docs/concepts/architecture/cgroups/"]
concepts: [container-isolation]
importance: 3
links: [{to: "ctn-01", kind: PREREQ}, {to: "ctn-03", kind: FOLLOWUP}, {to: "k8s-11", kind: RELATED}]
---
**모범 답변 (30~60초)**
네임스페이스가 프로세스에게 무엇이 보이는지를 나눈다면, cgroup은 프로세스 묶음이 CPU, 메모리, 프로세스 수 같은 자원을 얼마나 쓸 수 있는지를 제한하고 사용량을 집계합니다. 컨테이너를 시작할 때 컨테이너 전용 cgroup이 만들어지고 컨트롤러별로 한도가 기록되며, 한도는 커널이 강제합니다. 그래서 한 컨테이너가 자원을 독차지해 호스트나 다른 컨테이너를 마비시키는 일을 막을 수 있습니다. 반대로 cgroup은 다른 컨테이너의 데이터나 프로세스에 접근하는 것을 막아 주지는 않고, 그건 네임스페이스의 몫입니다.

```bash
docker run --rm --memory=64m --memory-swap=64m --cpus=0.5 --pids-limit=50 busybox:1.36 \
  sh -c 'cat /sys/fs/cgroup/memory.max /sys/fs/cgroup/cpu.max /sys/fs/cgroup/pids.max; cat /proc/self/cgroup'
```

(공식 문서) Docker security 페이지는 cgroup이 자원 계량과 제한을 하며 컨테이너 하나가 자원을 고갈시켜 시스템을 멈추게 하는 일(서비스 거부)을 막는 데 중요하지만, 한 컨테이너가 다른 컨테이너의 데이터와 프로세스에 접근하거나 영향을 주는 것을 막는 역할은 하지 않는다고 설명한다. OCI 런타임 사양은 cgroup이 컨테이너의 자원 사용을 제한하고 장치 접근을 다루며 cpu, memory, IO, pids, network, RDMA 컨트롤러가 있다고 한다. Kubernetes의 cgroup 문서는 kubelet과 컨테이너 런타임이 cgroup으로 CPU·메모리 requests와 limits를 적용한다고 하고, cgroup v2는 v1.25부터 안정(stable)이며 단일 통합 계층을 쓴다고 한다.
(실험 확인) Docker Engine 29.6.1(Docker Desktop VM, `docker info` 의 CgroupVersion 2)에서 위 명령의 출력은 `67108864`(64MiB), `50000 100000`, `50` 이었고 `/proc/self/cgroup` 은 `0::/` 였다. `--cgroupns=host` 로 띄우면 같은 파일이 `0::/docker/<컨테이너 ID>` 로 호스트 쪽 경로를 보여 줬으므로, 기본 컨테이너가 자기 cgroup을 루트로 보는 것은 cgroup 네임스페이스 때문이다. `/sys/fs/cgroup` 은 컨테이너 안에서 `cgroup2 ro,nosuid,nodev,noexec` 로 마운트돼 있었다. 한도를 주지 않은 컨테이너의 같은 파일은 `max`, `max 100000`, `max` 였다. 반례로 `--pid=host --memory=64m` 컨테이너의 `ps` 는 한도가 있어도 VM의 프로세스 606줄을 모두 보여 줬다. 즉 cgroup 한도는 보이는 범위를 바꾸지 않고 그건 pid 네임스페이스의 몫이다.
