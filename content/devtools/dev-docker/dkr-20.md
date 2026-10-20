---
slug: "dkr-20"
topic: "dev-docker"
tier: TRICKY
difficulty: 3
title: "컨테이너에 메모리 제한을 걸면 어떻게 되고, 자바 앱에서는 무엇을 주의해야 하나요?"
keywords: ["기본은 메모리 무제한", "-m으로 한도 설정", "한도 초과 시 OOM 킬", "종료 코드 137 OOMKilled", "MaxRAMPercentage 힙 비율"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.docker.com/engine/containers/resource_constraints/", "https://docs.docker.com/reference/cli/docker/container/run/", "https://docs.oracle.com/en/java/javase/25/docs/specs/man/java.html"]
---
**모범 답변 (30~60초)**
컨테이너는 기본적으로 메모리 제한이 없어서 호스트 메모리를 얼마든지 쓸 수 있고, 호스트 메모리가 부족해지면 커널이 프로세스를 죽이므로 운영에서는 `-m` 으로 한도를 둡니다. 한도를 넘기면 컨테이너의 프로세스가 OOM으로 강제 종료되어 종료 코드 137과 OOMKilled 상태가 남습니다. 자바는 힙 말고도 메타스페이스, 스레드 스택 같은 힙 밖 메모리를 쓰므로 한도에 딱 맞게 힙을 잡으면 안 됩니다. JVM은 컨테이너 한도를 인식해 기본 최대 힙을 한도의 일부로 잡는데, `MaxRAMPercentage` 기본값은 25이고 한도가 아주 작으면 비율이 달라지니, 필요하면 `-XX:MaxRAMPercentage` 로 조정합니다.

```bash
docker run --rm -m 512m amazoncorretto:25-alpine \
  java -XX:+PrintFlagsFinal -version | grep MaxHeapSize
```

(공식 문서) Resource constraints 페이지는 컨테이너가 기본적으로 리소스 제한이 없고 호스트 커널 스케줄러가 허용하는 만큼 쓸 수 있다고 하며, 리눅스 호스트에서 메모리가 부족하면 커널이 OOME를 던지고 프로세스를 죽이기 시작해 시스템 전체가 위험해질 수 있다고 한다. 컨테이너의 OOM 우선순위는 조정되지 않아 개별 컨테이너가 먼저 죽을 가능성이 높고, 운영 전에 메모리 요구량을 시험하고 컨테이너 메모리를 제한하라고 한다. `-m`/`--memory` 는 최대 메모리(최소 6m)이고 `--memory-swap` 으로 스왑을, `--memory-reservation` 으로 소프트 제한을 줄 수 있다고 한다.
(실험 확인) 이 PC의 Docker Engine 29.6.1(Docker Desktop VM 메모리 약 8.3GB)에서 amazoncorretto:25-alpine(OpenJDK 25.0.4.1)으로 확인했다. 제한이 없을 때 `MaxHeapSize` 는 2,080,374,784(`MaxRAMPercentage` 25, `UseContainerSupport` true, `-XshowSettings:system` 의 `Memory Limit: Unlimited`)였고, `-m 512m` 은 134,217,728(128MiB), `-m 1g` 는 268,435,456이었다(재실행에서 `-m 128m` 은 67,108,864, `-m 256m`·`300m`·`384m` 는 132,120,576으로 한도의 25%가 아니었으므로, 25%는 이 JDK에서 512m 이상으로 확인한 범위다). `-m 512m` 에 `-XX:MaxRAMPercentage=75` 를 주면 402,653,184였다. `-m 128m` 컨테이너에서 `-Xmx400m` 으로 힙에 10MB 배열을 계속 채우는 자바 프로그램을 3번 실행하자 매번 `docker inspect` 가 `exit=137 oomkilled=true` 였다. 같은 프로그램을 `-Xmx` 없이(`-m 128m` 에서 기본 최대 힙 64MiB) 실행하면 컨테이너가 죽지 않고 자바의 `OutOfMemoryError` 로 종료 코드 1이었다.
(공식 문서) JDK 25 `java` 명령 문서는 `-XX:MaxRAMPercentage` 의 기본값이 25퍼센트이고, `-XX:MinRAMPercentage` 는 작은 힙(약 125MB)에 적용되며 기본값이 50퍼센트라고 설명한다. 그래서 한도가 아주 작으면 비율이 달라진다.
(보충) 자바가 힙 밖 메모리(메타스페이스, 스레드 스택, 다이렉트 버퍼 등)를 쓰므로 힙을 한도 전체로 잡으면 안 된다는 설명은 위 문서들이 직접 서술하지 않은 일반 설명이다.
