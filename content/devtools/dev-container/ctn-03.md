---
slug: "ctn-03"
topic: "dev-container"
tier: BASIC
difficulty: 2
title: "`docker run`의 `--memory`와 `--cpus` 옵션은 실제로 커널에 어떻게 적용되고, 한도를 넘으면 메모리와 CPU는 각각 어떻게 되나요?"
keywords: ["cgroup 파일에 값을 기록", "memory.max 바이트 한도", "cpus는 cpu.max 쿼터와 기간", "메모리 초과는 OOM kill", "CPU 초과는 throttling"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.docker.com/engine/containers/resource_constraints/", "https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/", "https://kubernetes.io/docs/concepts/architecture/cgroups/"]
concepts: [container-isolation, jvm-in-container]
importance: 2
links: [{to: "ctn-02", kind: PREREQ}, {to: "ctn-14", kind: FOLLOWUP}, {to: "ctn-15", kind: FOLLOWUP}, {to: "dkr-20", kind: RELATED}, {to: "k8s-18", kind: RELATED}]
---
**모범 답변 (30~60초)**
Docker는 컨테이너 전용 cgroup을 만들고 거기에 값을 적습니다. `--memory=64m` 은 메모리 한도를 바이트 단위로 `memory.max` 에 적는 것이고, `--cpus=0.5` 는 CFS 스케줄러의 기간 100ms 중 50ms만 쓰게 하는 쿼터로 바뀝니다. 한도를 넘었을 때의 반응은 다릅니다. 메모리는 커널이 OOM으로 프로세스를 죽이고, CPU는 죽이지 않고 쿼터를 다 쓴 구간 동안 실행을 멈춰 속도만 늦춥니다. 한도를 주지 않으면 호스트 커널 스케줄러가 허용하는 만큼 쓸 수 있습니다.

```bash
docker run -d --name c --cpus=0.5 busybox:1.36 sh -c 'while :; do :; done'
docker stats --no-stream c       # CPU 50% 안팎
docker exec c sh -c 'cat /sys/fs/cgroup/cpu.max; grep throttled /sys/fs/cgroup/cpu.stat'
```

(공식 문서) Resource constraints 페이지는 CPU 옵션을 쓰면 Docker가 호스트에서 컨테이너 cgroup의 설정을 바꾼다고 하고, `--cpus=1.5` 가 `--cpu-period=100000 --cpu-quota=150000` 과 같다고 설명한다. 기간 기본값은 100000마이크로초이고, `--memory` 의 최솟값은 6m이다. 제한이 없으면 컨테이너는 호스트 커널 스케줄러가 허용하는 만큼 쓸 수 있고, 호스트 메모리가 부족하면 커널이 OOM으로 프로세스를 죽이기 시작한다고 한다. Kubernetes 자원 관리 문서는 CPU limit은 CPU throttling으로, 메모리 limit은 OOM kill로 커널이 강제한다고 하며, 메모리는 커널이 메모리 압박을 감지할 때만 죽이므로 limit을 넘어도 즉시 죽지 않을 수 있다(반응형 강제)고 한다.
(실험 확인) Docker Engine 29.6.1에서 `--memory=64m --cpus=0.5` 컨테이너를 `docker inspect` 하면 `Memory=67108864`, `NanoCpus=500000000`(`CpuPeriod`·`CpuQuota` 는 0)이었고(Docker가 내부 값으로 바꿔 보관한다), 컨테이너 안의 cgroup 파일은 `memory.max=67108864`, `cpu.max=50000 100000` 이었다. 계속 도는 반복문 컨테이너를 약 5초 돌린 뒤 `docker stats` 의 CPU 사용률은 `--cpus=0.5` 일 때 50.44%, 한도가 없을 때 101.24% 였고, 한도가 있는 쪽의 `cpu.stat` 은 `nr_periods 73`, `nr_throttled 72`, `throttled_usec 3597715` 로 거의 모든 기간에서 쿼터에 막혔으며 한도가 없는 쪽은 `cpu.max` 가 `max 100000`, `nr_throttled 0` 이었다. 반례로 `--cpus=1.5` 와 `--cpu-period=100000 --cpu-quota=150000` 은 둘 다 `cpu.max` 가 `150000 100000` 이었고, `--memory=5m` 은 `Minimum memory limit allowed is 6MB` 로 거부되며 `--memory=6m` 은 `memory.max` 가 `6291456` 으로 적용됐다. 메모리 초과가 어떻게 끝나는지는 OOM 종료 코드를 다룬 질문에서 실험했다.
