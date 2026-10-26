---
slug: "ctn-12"
topic: "dev-container"
tier: DEEP
difficulty: 3
title: "OCI 런타임 사양에서 컨테이너는 어떤 입력으로 만들어지고, create와 start가 나뉘어 있는 이유는 무엇인가요?"
keywords: ["번들은 config.json과 root 파일시스템", "create는 환경만 만들고 프로그램은 미실행", "start에서 사용자 프로그램 실행", "creating·created·running·stopped 상태", "단계 사이에 훅 실행"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://raw.githubusercontent.com/opencontainers/runtime-spec/main/spec.md", "https://raw.githubusercontent.com/opencontainers/runtime-spec/main/bundle.md", "https://raw.githubusercontent.com/opencontainers/runtime-spec/main/runtime.md", "https://raw.githubusercontent.com/opencontainers/runtime-spec/main/config.md", "https://raw.githubusercontent.com/opencontainers/runtime-spec/main/config-linux.md"]
concepts: [container-image]
importance: 1
links: [{to: "ctn-05", kind: PREREQ}]
---
**모범 답변 (30~60초)**
OCI 런타임 사양에서 컨테이너의 입력은 번들입니다. 번들은 실행 설정인 `config.json` 과 root 파일시스템 디렉터리로 이뤄지고, 설정에는 실행할 프로세스, 네임스페이스, cgroup 한도, 마운트, capability 같은 항목이 들어갑니다. 생명주기는 `create` 로 설정대로 환경만 만들고 사용자 프로그램은 아직 실행하지 않은 created 상태를 만든 뒤, `start` 로 프로그램을 실행해 running이 되고, 프로세스가 끝나면 stopped이며 `delete` 로 정리합니다. 훅은 이 단계 사이사이에서 실행되고, 그래서 create와 start가 나뉘어 있습니다.

```bash
docker create --name st busybox:1.36 sleep 5
docker inspect st --format '{{.State.Status}} pid={{.State.Pid}}'   # Docker 의 created, pid=0 (OCI 의 created 와는 다름)
docker start st && docker inspect st --format '{{.State.Status}} pid={{.State.Pid}}'
```

(공식 문서) 번들 문서는 번들을 루트에 반드시 있어야 하는 `config.json` 과, `root.path` 가 설정된 경우 그것이 가리키는 root 파일시스템으로 정의한다. 런타임 문서의 상태는 creating, created(`create` 가 끝났고 컨테이너 프로세스가 끝나지도 사용자 프로그램을 실행하지도 않은 상태이며 이때 `pid` 가 필수), running, stopped이다. 생명주기는 `create` 에서 `config.json` 대로 환경을 만들되 사용자 프로그램은 실행하지 않고, `prestart`(deprecated)·`createRuntime`·`createContainer` 훅을 호출한 뒤, `start` 가 호출되면 `startContainer` 훅 다음에 사용자 프로그램을 실행하고 `poststart` 훅을 부르며, 프로세스가 끝난 뒤 `delete` 가 만든 것을 되돌리고 `poststop` 훅을 부른다고 한다. 설정 문서의 `process` 에는 `cwd`, `env`, `args`, Linux의 `capabilities` 가 있고, `root.readonly` 로 root 파일시스템을 읽기 전용으로 할 수 있으며, Linux 설정에는 네임스페이스와 cgroup 항목이 있다.
(실험 확인) Docker Engine 29.6.1에서 `docker create` 직후 `State.Status` 는 `created`, `State.Pid` 는 0, `StartedAt` 은 `0001-01-01T00:00:00Z` 였고, `docker start` 후에는 `running` 과 호스트 PID(85529), `docker stop -t 1` 로 끝낸 뒤에는 `exited`, PID 0, 종료 코드 137이었다(2026-10-27 재실행. PID 1인 `sleep` 이 SIGTERM에 반응하지 않아 SIGKILL로 끝났다). 스스로 끝나는 `sleep 2` 컨테이너는 `exited`, 코드 0이었다. 다만 Docker의 `created` 는 Docker가 컨테이너 객체를 만든 상태이고 호스트에 프로세스가 없지만(PID 0), OCI 사양의 `created` 는 `pid` 가 필수인 상태라서 둘은 같은 상태가 아니다. OCI 런타임에 `create` 만 요청한 직후의 상태는 이번 실험에서 직접 관찰하지 못했다. `docker info` 는 runc가 OCI 런타임 사양 1.0.0부터 1.2.1까지를 지원한다고 보고했고 훅 목록(prestart, createRuntime, createContainer, startContainer, poststart, poststop)이 사양과 같았다. Docker의 `exited` 와 OCI의 `stopped` 는 이름이 다르다.
(보충) create와 start를 나눈 이유가 훅을 끼워 넣기 위해서라는 설명은 위 생명주기 순서(create 단계에서 환경을 만든 뒤 `createRuntime`·`createContainer` 훅이 실행되고 start에서 `startContainer` 훅과 프로그램 실행이 이어짐)에서 이끌어 낸 것이며, 문서가 이 이유를 직접 적지는 않는다.
