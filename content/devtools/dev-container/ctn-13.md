---
slug: "ctn-13"
topic: "dev-container"
tier: TRICKY
difficulty: 3
title: "컨테이너 안의 PID 1은 왜 특별하고, 좀비 프로세스는 어떻게 생기며, `--init` 옵션은 무엇을 해결하나요?"
keywords: ["PID 1은 고아 프로세스의 부모", "자식을 wait로 회수하지 않으면 좀비", "PID 1은 시그널 기본 동작 미적용", "--init은 tini를 PID 1로", "유예 후 SIGKILL로 종료 코드 137"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.docker.com/engine/containers/multi-service_container/", "https://docs.docker.com/reference/cli/docker/container/run/", "https://docs.docker.com/reference/cli/docker/container/stop/", "https://docs.docker.com/reference/cli/docker/container/kill/"]
concepts: [container-isolation, graceful-shutdown]
importance: 2
links: [{to: "ctn-01", kind: PREREQ}, {to: "dkr-16", kind: RELATED}]
---
**모범 답변 (30~60초)**
컨테이너 안에서 앱이 PID 1이면 init 프로세스의 역할을 떠맡습니다. 부모가 먼저 죽은 고아 프로세스는 PID 1의 자식이 되는데, 앱이 자식의 종료를 회수하지 않으면 종료된 프로세스가 좀비로 남습니다. 또 PID 1은 시그널 핸들러를 달지 않으면 SIGTERM의 기본 종료 동작이 적용되지 않아서, `docker stop` 이 유예 시간이 지난 뒤 SIGKILL로 강제 종료하고 종료 코드는 137이 됩니다. `--init` 은 작은 init 프로세스(tini)를 PID 1로 넣어 좀비를 회수하고 시그널을 앱에 전달해 줍니다.

```bash
CMD='(sleep 1 &); exec sleep 30'          # 고아 프로세스를 만든 뒤 sleep 30 이 PID 1(또는 init의 자식)
docker run -d --name z1 busybox:1.36 sh -c "$CMD"
docker run -d --init --name z2 busybox:1.36 sh -c "$CMD"
sleep 3; docker exec z1 ps -o pid,ppid,stat,args; docker exec z2 ps -o pid,ppid,stat,args
time docker stop -t 3 z1; time docker stop -t 3 z2
```

(공식 문서) Docker의 다중 프로세스 문서는 컨테이너의 주 프로세스가 자기가 시작한 모든 프로세스를 관리할 책임이 있고, 자식 회수(reaping)를 제대로 못 하는 프로세스에는 `--init` 이 작은 init 프로세스를 주 프로세스로 넣어 컨테이너가 끝날 때 모든 프로세스를 회수해 준다고 한다. `docker run` 문서는 `--init` 이 PID 1로 init 프로세스를 써서 좀비 회수 같은 init의 일반 책임을 수행하게 하고, 기본으로 쓰이는 `docker-init` 은 tini 기반이라고 한다. `docker stop` 문서는 주 프로세스가 SIGTERM을 받고 유예 시간 후 SIGKILL을 받는다고 하고, `docker kill` 은 기본으로 SIGKILL을 보낸다고 한다.
(실험 확인) Docker Engine 29.6.1(busybox:1.36)에서 위 명령을 재실행했다(2026-10-27). `--init` 없이는 `ps` 에 PID 1 `sleep 30` 과 `Z`(좀비) 상태의 `[sh]`(PPID 1)가 남았고, `--init` 컨테이너는 PID 1이 `/sbin/docker-init -- sh -c …` 이고 `sleep 30` 은 그 자식(PPID 1)이었으며 좀비가 없었다. `docker stop -t 3` 은 `--init` 없는 컨테이너에서 3.18초가 걸리고 종료 코드 137, `--init` 컨테이너에서 0.15초에 종료 코드 143이었다. 즉 시그널 핸들러가 없는 PID 1은 SIGTERM에 종료하지 않았고, init은 SIGTERM을 자식에게 전달해 종료시켰다. 반례로 `trap "exit 0" TERM` 으로 핸들러를 단 셸이 PID 1인 컨테이너는 `docker stop` 이 0.13초에 끝나고 종료 코드 0이었다. 즉 PID 1이어도 핸들러가 있으면 SIGTERM에 반응한다. `docker info` 는 `Init Binary: docker-init` 을 보고했다.
(보충) PID 1에 시그널 기본 동작이 적용되지 않는다는 커널 동작과 종료 코드가 128에 시그널 번호를 더한 값(137은 9, 143은 15)이라는 관례는 읽은 문서가 직접 서술하지 않으며, 위 실험 결과에서 이끌어 낸 설명이다.
