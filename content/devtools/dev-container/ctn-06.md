---
slug: "ctn-06"
topic: "dev-container"
tier: BASIC
difficulty: 2
title: "쿠버네티스는 왜 Docker Engine 대신 containerd 같은 CRI 런타임을 쓰게 됐고, 기존에 Docker로 만든 이미지는 계속 쓸 수 있나요?"
keywords: ["kubelet과 런타임의 표준 인터페이스 CRI", "dockershim은 v1.24에서 제거", "Docker Engine은 CRI 미구현", "containerd·CRI-O 사용", "OCI 이미지는 그대로 동작"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://kubernetes.io/docs/concepts/architecture/cri/", "https://kubernetes.io/docs/setup/production-environment/container-runtimes/", "https://kubernetes.io/blog/2022/02/17/dockershim-faq/"]
concepts: [container-image]
importance: 2
links: [{to: "ctn-05", kind: PREREQ}, {to: "k8s-02", kind: RELATED}]
---
**모범 답변 (30~60초)**
kubelet은 컨테이너 런타임과 CRI라는 gRPC 표준 인터페이스로 통신하는데 Docker Engine은 CRI를 구현하지 않아서, 쿠버네티스가 dockershim이라는 임시 연결 코드를 자체에 들고 있었습니다. 이 코드는 유지 부담이 컸고 cgroup v2나 사용자 네임스페이스 같은 기능과도 맞지 않아 v1.24에서 제거됐습니다. 그래서 노드에는 containerd나 CRI-O 같은 CRI 런타임을 쓰고, Docker로 빌드한 이미지는 OCI 표준이라 모든 CRI 구현에서 그대로 동작합니다. Docker Engine을 꼭 쓰려면 cri-dockerd 어댑터를 거쳐야 합니다.

```bash
kubectl get node -o wide        # CONTAINER-RUNTIME 열
```

(공식 문서) Kubernetes CRI 문서는 CRI를 kubelet과 컨테이너 런타임 사이의 주된 gRPC 프로토콜이자, 클러스터 구성 요소를 다시 컴파일하지 않고 다양한 런타임을 쓰게 하는 플러그인 인터페이스라고 설명한다(v1.23부터 안정, v1.26 이후 kubelet은 런타임이 CRI v1을 지원해야 노드를 등록한다). 컨테이너 런타임 문서는 containerd, CRI-O, Docker Engine, Mirantis Container Runtime을 예로 들고 dockershim이 v1.24에서 제거됐다고 한다. dockershim FAQ는 Docker Engine이 CRI를 구현하지 않아 쿠버네티스 안에 임시 코드를 넣었고 그 유지가 부담이 되었으며, cgroup v2와 사용자 네임스페이스처럼 dockershim과 맞지 않는 기능이 새 CRI 런타임에서 구현되고 있다고 설명한다. 또 `docker build` 로 만든 이미지는 모든 CRI 구현에서 그대로 동작하고, Docker Engine을 계속 쓰려면 Mirantis와 Docker가 유지하는 어댑터 cri-dockerd를 쓰면 된다고 한다.
(실험 확인) Docker Desktop의 단일 노드 클러스터(Kubernetes v1.36.1)에서 `kubectl get node -o wide` 의 CONTAINER-RUNTIME은 `docker://29.6.1` 이었다(2026-10-27 재실행). Docker Desktop VM의 프로세스 목록에는 `/usr/bin/cri-dockerd`(`--docker-endpoint` 로 Docker 소켓 프록시에 연결)가 있었고, kubelet의 `--container-runtime-endpoint` 는 `unix:///var/run/cri-dockerd.sock` 이었다. 즉 이 실험 클러스터는 문서가 말한 대로 kubelet이 cri-dockerd 어댑터를 거쳐 Docker Engine에 연결된 구성이다. 이 클러스터에서 로컬 이미지 `busybox:1.36` 로 만든 Pod들은 정상 실행됐다.
(보충) 위 클러스터는 학습용 단일 노드 환경이며, 운영 클러스터의 런타임 선택(containerd 또는 CRI-O)은 이 실험으로 확인한 것이 아니다.
