---
slug: "ctn-14"
topic: "dev-container"
tier: TRICKY
difficulty: 2
title: "컨테이너가 종료 코드 137로 끝났다면 항상 메모리 부족(OOM) 때문인가요? 원인은 어떻게 구분하나요?"
keywords: ["137은 SIGKILL로 종료", "OOM 외에 docker kill·stop 유예 초과도 137", "State.OOMKilled 확인", "쿠버네티스 reason: OOMKilled", "정상 종료 시그널 SIGTERM은 143"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.docker.com/engine/containers/resource_constraints/", "https://docs.docker.com/reference/cli/docker/container/stop/", "https://docs.docker.com/reference/cli/docker/container/kill/", "https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/", "https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/"]
concepts: [jvm-in-container, container-isolation]
importance: 2
links: [{to: "ctn-03", kind: PREREQ}, {to: "k8o-07", kind: RELATED}, {to: "k8o-19", kind: RELATED}, {to: "dkr-16", kind: RELATED}]
---
**모범 답변 (30~60초)**
아닙니다. 137은 보통 128에 시그널 번호 9를 더한 값으로 SIGKILL로 죽었다는 뜻인데, OOM 킬러뿐 아니라 `docker kill` 이나 `docker stop` 의 유예 시간이 지나 강제 종료된 경우에도 나옵니다. 그래서 `docker inspect` 의 `State.OOMKilled` 가 true인지 보고, 쿠버네티스에서는 컨테이너 상태의 reason이 OOMKilled인지 확인합니다. SIGTERM을 받아 정상적으로 끝난 경우는 보통 143입니다. 메모리가 원인이라면 한도를 올리거나 앱의 메모리 사용을 줄여야 하고, 아니라면 종료 신호를 처리하는지부터 봐야 합니다.

```bash
docker run --name oom --memory=64m --memory-swap=64m busybox:1.36 \
  sh -c 'x=$(head -c 200000000 /dev/zero | tr "\0" a)'; echo $?     # 137
docker inspect oom --format 'OOMKilled={{.State.OOMKilled}} ExitCode={{.State.ExitCode}}'
```

(공식 문서) Resource constraints 문서는 호스트 메모리가 부족하면 커널이 OOM으로 프로세스를 죽이고 컨테이너의 OOM 우선순위는 조정되지 않아 개별 컨테이너가 먼저 죽을 가능성이 높다고 한다. `docker stop` 문서는 SIGTERM 후 유예 시간이 지나면 SIGKILL을 보낸다고 하고, `docker kill` 문서는 기본 신호가 SIGKILL이라고 한다. Kubernetes 문서는 메모리 limit을 넘으면 커널이 OOM으로 컨테이너를 죽이며 Pod 상태에 `Reason: OOMKilled`, `Exit Code: 137` 이 나타나는 예를 보여 준다.
(실험 확인) Docker Engine 29.6.1에서 메모리 64m(스왑도 64m) 컨테이너가 200MB 문자열을 만들려 하자 종료 코드 137이었고 `State.OOMKilled=true` 였다(2026-10-27 재실행). 반면 실행 중인 컨테이너에 `docker kill` 을 하자 종료 코드는 똑같이 137이지만 `OOMKilled=false` 였다. SIGTERM에 반응하지 않는 PID 1 `sleep` 에 `docker stop -t 1` 을 해도 `OOMKilled=false` 에 137이었고, `--init` 컨테이너는 143이었다. 반례로 `sh -c 'exit 137'` 처럼 프로그램이 스스로 137로 끝나도 종료 코드 137에 `OOMKilled=false` 였고, `docker kill -s TERM` 을 보낸 핸들러 없는 PID 1 `sleep` 은 계속 `running` 이었다. Kubernetes v1.36.1에서 `limits.memory: 64Mi` 인 같은 동작의 Pod는 `STATUS` 가 `OOMKilled`, `state.terminated` 가 `exitCode: 137`, `reason: OOMKilled` 였다.
(보충) 137이 128 + 9, 143이 128 + 15라는 풀이는 셸의 종료 상태 관례이며 읽은 문서가 직접 적은 것이 아니다. 위 실험 값은 이 관례와 일치했다.
