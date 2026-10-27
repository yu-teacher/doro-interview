---
slug: "ctn-15"
topic: "dev-container"
tier: TRICKY
difficulty: 3
title: "컨테이너 안에서 `free`나 `nproc`은 호스트의 값을 보여주는데, 메모리·CPU 제한을 건 자바 앱은 제한 값을 어떻게 알고 힙을 정하나요?"
keywords: ["free·nproc은 호스트 값 표시", "실제 한도는 cgroup 파일에", "JVM은 컨테이너 지원으로 cgroup을 읽음", "한도에 맞춰 기본 최대 힙 계산", "한도에 따라 같은 이미지도 힙이 달라짐"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.docker.com/engine/containers/resource_constraints/", "https://raw.githubusercontent.com/opencontainers/runtime-spec/main/config-linux.md"]
concepts: [jvm-in-container]
importance: 3
links: [{to: "ctn-03", kind: PREREQ}, {to: "dkr-20", kind: RELATED}, {to: "k8o-19", kind: RELATED}]
---
**모범 답변 (30~60초)**
컨테이너는 호스트 커널을 공유하고 `free` 나 `nproc` 같은 도구가 읽는 시스템 정보에는 cgroup 한도가 반영되지 않아서 호스트의 메모리와 코어 수가 보입니다. 진짜 한도는 `/sys/fs/cgroup` 의 `memory.max`, `cpu.max` 같은 파일에 있고, JVM은 시작할 때 이 cgroup 값을 읽는 컨테이너 지원이 기본으로 켜져 있어서 호스트 메모리가 아니라 컨테이너 한도를 기준으로 기본 최대 힙을 정합니다. 그래서 같은 이미지도 한도에 따라 힙이 달라지고, 힙을 한도 전체로 잡지 말고 비율로 조정해야 합니다.

```bash
docker run --rm --memory=256m --cpus=2 amazoncorretto:21 sh -c 'nproc; cat /sys/fs/cgroup/memory.max /sys/fs/cgroup/cpu.max'
docker run --rm --memory=256m --cpus=2 amazoncorretto:21 java -XshowSettings:system -version
docker run --rm --memory=256m amazoncorretto:21 java -XX:+PrintFlagsFinal -version | grep -E 'MaxHeapSize|UseContainerSupport'
docker run --rm --memory=256m amazoncorretto:21 java -XX:-UseContainerSupport -XX:+PrintFlagsFinal -version | grep MaxHeapSize
```

(공식 문서) Resource constraints 문서는 컨테이너 안에서 `free` 같은 도구가 컨테이너 안에서 쓸 수 있는 스왑이 아니라 호스트의 스왑을 보고하므로 이 출력으로 스왑 유무를 판단하지 말라고 한다(메모리 총량과 CPU 수에 대한 서술은 아니다). Docker는 `--memory`·`--cpus` 를 호스트의 cgroup 설정으로 바꿔 적용하고, OCI 런타임 사양의 cgroup 설정(`memory.limit`, `cpu.quota` 등)이 그 값을 담는다.
(실험 확인) Docker Engine 29.6.1(Docker Desktop VM, 메모리 약 8.3GB, 15코어)에서 `--memory=256m --cpus=2` 컨테이너의 `nproc` 은 15, `memory.max` 는 268435456, `cpu.max` 는 `200000 100000` 이었다(2026-10-27 재실행). `--memory=64m` 컨테이너(busybox)의 `free -m` 에는 총 메모리 7935MB가 보였다. Amazon Corretto 21.0.13의 `-XshowSettings:system` 은 `Provider: cgroupv2`, `Effective CPU Count: 2`, `CPU Quota: 200000us` 로 한도를 읽었고 `-XX:-UseContainerSupport` 를 주면 `No metrics available for this platform` 이었다. `MaxHeapSize` 는 한도 없이 2,080,374,784(호스트 메모리 기준, `UseContainerSupport` true가 기본값), `--memory=1g` 에서 268,435,456, `--memory=512m` 에서 134,217,728로 둘 다 한도의 25%(`MaxRAMPercentage` 기본 25)였다. 그러나 `--memory=256m` 에서는 132,120,576(126MiB, 25%가 아니다)이었고 128m 에서 67,108,864, 200m 에서 104,857,600(둘 다 50%), 300m·400m 에서 132,120,576 이었다. `-XX:MinRAMPercentage=25` 를 주면 256m 에서 67,108,864(64MiB)가 됐고(`MinRAMPercentage` 기본값은 50), `-XX:MaxRAMPercentage=75` 는 201,326,592, `-Xmx200m` 은 209,715,200, `-XX:-UseContainerSupport` 는 다시 2,080,374,784 였다. Corretto 8(`1.8.0_512`)·11(`11.0.33`)·17(`17.0.21`)·25(`25.0.4.1`)도 `--memory=256m` 에서 `UseContainerSupport` true, `MaxHeapSize` 132,120,576 이었다.
(보충) 한도가 작을 때 기본 최대 힙이 한도의 25%보다 커지는 이유(작은 메모리에서는 `MinRAMPercentage` 가 쓰이는 것으로 보인다)는 위 실험 결과에서 이끌어 낸 것이고 JDK 문서는 이번 출처 범위 밖이라 확인하지 못했다. JVM의 컨테이너 지원이 cgroup 파일을 읽는다는 설명, 그리고 힙 밖 메모리(메타스페이스, 스레드 스택 등)가 한도 안에 함께 들어가므로 힙을 한도 전체로 잡으면 안 된다는 설명도 일반 설명이다. `free`·`nproc` 이 호스트 값을 보이는 이유도 문서에서 직접 확인하지 못했고 실험 결과만 있다.
