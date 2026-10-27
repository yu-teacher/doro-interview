---
slug: "ctn-05"
topic: "dev-container"
tier: BASIC
difficulty: 2
title: "Docker, containerd, runc는 각각 어떤 일을 하고, `docker run` 하면 이 셋이 어떻게 이어지나요?"
keywords: ["dockerd는 API·이미지·네트워크 관리", "containerd는 컨테이너 생명주기와 이미지 저장", "runc는 OCI 런타임 사양 구현", "shim을 거쳐 runc 호출", "고수준 런타임과 저수준 런타임"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://containerd.io/", "https://raw.githubusercontent.com/containerd/containerd/main/docs/runtime-v2.md", "https://kubernetes.io/blog/2022/02/17/dockershim-faq/", "https://docs.docker.com/engine/daemon/", "https://raw.githubusercontent.com/opencontainers/runtime-spec/main/runtime.md", "https://docs.docker.com/get-started/docker-overview/"]
concepts: [container-image, container]
importance: 2
links: [{to: "ctn-04", kind: PREREQ}, {to: "ctn-06", kind: FOLLOWUP}, {to: "dkr-02", kind: RELATED}]
---
**모범 답변 (30~60초)**
Docker 클라이언트의 요청은 dockerd 데몬이 받아 이미지, 네트워크, 볼륨 같은 Docker 객체를 다루고, 컨테이너 실행과 이미지 저장 같은 생명주기는 containerd가 맡습니다. containerd 문서는 자신을 컨테이너 활동을 조율하는 고수준 관리자로, 실제로 컨테이너를 시작하고 멈추는 쪽을 저수준 런타임으로 구분합니다. containerd는 직접 컨테이너를 띄우지 않고 shim 프로세스를 통해 OCI 런타임 사양 구현체인 runc를 호출하며, runc가 네임스페이스와 cgroup을 만들어 프로세스를 시작합니다. 시작된 뒤 호스트에서 보면 컨테이너 프로세스의 부모는 runc가 아니라 shim이고 runc 프로세스는 남아 있지 않습니다.

```bash
docker run -d --name rt busybox:1.36 sleep 300
docker run --rm --pid=host busybox:1.36 ps -o pid,ppid,args | grep -E 'dockerd|containerd|shim|sleep 300'
docker inspect rt --format 'pid={{.State.Pid}} runtime={{.HostConfig.Runtime}}'
```

(공식 문서) containerd 공식 사이트는 containerd를 이미지 전송과 저장부터 컨테이너 실행과 감독, 저수준 스토리지와 네트워크 연결까지 호스트의 컨테이너 생명주기 전체를 관리하는 데몬으로 소개하고, OCI Image Spec 지원을 기능으로 든다. containerd의 runtime v2 문서는 containerd 데몬이 컨테이너를 직접 띄우지 않고 컨테이너와 콘텐츠 활동을 조율하는 상위(higher-level) 관리자이며 실제로 컨테이너를 시작·중지·관리하는 것은 하위(lower-level) 프로그램인 런타임이라고 하고, containerd가 직접 런타임 엔진을 부르는 것이 아니라 소켓을 듣는 shim이 runtime engine을 호출한다고 설명한다. 가장 흔한 런타임 엔진은 OCI 런타임 사양을 구현한 runc이며, shim 하나가 여러 컨테이너를 맡을 수도 있다고 한다. Kubernetes의 dockershim FAQ는 runc가 containerd와 CRI-O 둘 다의 기본 런타임이라고 한다. Docker overview는 dockerd가 Docker API 요청을 듣고 이미지, 컨테이너, 네트워크, 볼륨 같은 객체를 관리한다고 하고, 데몬 설정 문서는 containerd 이미지 스토어를 쓰면 이미지 콘텐츠와 컨테이너 스냅샷이 containerd의 저장 위치에 놓인다고 한다. OCI 런타임 사양의 생명주기는 `create` 가 환경만 만들고 사용자 프로그램은 `start` 에서 실행된다고 한다.
(실험 확인) Docker Engine 29.6.1(Docker Desktop 리눅스 VM)에서 위 명령을 재실행하자(2026-10-27) `dockerd`(`/usr/local/bin/dockerd --config-file /run/config/docker/daemon.json`)와 `/usr/bin/containerd --config /etc/containerd/containerd.toml` 가 별개 프로세스로 보였고, 컨테이너마다 `containerd-shim-runc-v2 -namespace moby -id <컨테이너 ID> -address /run/containerd/containerd.sock` 프로세스가 하나씩 있었다(이 컨테이너의 shim `-id` 앞부분 `e610ad1385ba` 가 `docker inspect` 의 컨테이너 ID와 같았다). `sleep 300` 의 PPID는 그 컨테이너의 shim PID(18242)였고 shim의 PPID는 1이었으며, 프로세스 목록에 runc 프로세스는 따로 보이지 않았다. 같은 프로세스가 컨테이너 안에서는 PID 1이고 호스트(VM)에서는 `docker inspect` 의 `State.Pid` 로 18265였다. `docker info` 는 기본 런타임을 `runc`(`io.containerd.runc.v2`)로, runc 버전을 1.3.6으로 보고했다.
(보충) dockerd가 컨테이너 실행을 containerd에 맡긴다는 직접적인 서술은 읽은 문서(Docker·containerd·Kubernetes 공식 문서)에서 찾지 못했고, 위 프로세스 구조(shim이 containerd 소켓 주소를 받아 실행되고 `-namespace moby` 를 쓰는 것)에서 이끌어 낸 설명이다. 또 컨테이너마다 shim이 하나씩 뜨는 것은 이 Docker 환경에서 본 모습이며, runtime v2 문서는 shim 하나가 여러 컨테이너를 맡을 수도 있다고 한다.
