---
slug: "ctn-11"
topic: "dev-container"
tier: DEEP
difficulty: 2
title: "컨테이너의 루트 파일시스템은 어떻게 구성되고, 이미지에 있던 파일을 수정하면 copy-on-write는 어떻게 일어나나요?"
keywords: ["overlayfs의 lowerdir는 읽기 전용 이미지 레이어", "upperdir는 컨테이너 쓰기 레이어", "처음 쓸 때 복사(copy-up)", "파일 전체 복사", "쓰기 많은 데이터는 볼륨"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.docker.com/engine/storage/drivers/overlayfs-driver/", "https://docs.docker.com/engine/storage/drivers/", "https://docs.docker.com/engine/storage/containerd/"]
concepts: [container-isolation, container-image]
importance: 2
links: [{to: "ctn-02", kind: PREREQ}, {to: "ctn-16", kind: FOLLOWUP}, {to: "dkr-02", kind: RELATED}, {to: "dkr-19", kind: RELATED}, {to: "dkr-07", kind: RELATED}]
---
**모범 답변 (30~60초)**
컨테이너의 루트는 overlayfs 같은 유니온 파일시스템으로, 이미지의 읽기 전용 레이어들을 lowerdir로 쌓고 그 위에 컨테이너 전용 쓰기 레이어 upperdir를 얹어 하나로 보이게 한 것입니다. 읽을 때는 upperdir에 없으면 이미지 레이어에서 읽습니다. 이미지에 있던 파일을 처음 수정하면 그 파일이 통째로 upperdir로 복사되는 `copy_up` 이 일어나고, 이후 쓰기는 복사본에 합니다. 파일 단위라서 큰 파일을 조금만 고쳐도 전부 복사되어 쓰기 성능에 영향이 있으므로, 쓰기가 많은 데이터는 볼륨에 둡니다.

```bash
docker run -d --name cu busybox:1.36 sh -c 'echo hi >> /etc/passwd; echo x >> /etc/extra; sleep 100'
docker diff cu                        # C /etc, C /etc/passwd, A /etc/extra
docker exec cu grep ' / ' /proc/mounts   # overlay / overlay rw,lowerdir=...,upperdir=...,workdir=...
```

(공식 문서) OverlayFS 문서는 이미지(lowerdir)와 컨테이너(upperdir) 레이어를 합쳐 컨테이너 마운트를 만들고, 읽을 때 파일이 upperdir에 없으면 lowerdir에서 읽으며 양쪽에 있으면 upperdir의 것이 가려 쓴다고 설명한다. 이미지에 있는 파일을 처음 쓰면 `copy_up` 으로 lowerdir에서 upperdir로 복사하고 그 복사본에 쓰는데, OverlayFS는 블록이 아니라 파일 단위라서 파일 일부만 고쳐도 전체를 복사하고 첫 쓰기에만 일어난다고 한다. Storage drivers 문서는 같은 이미지로 띄운 컨테이너들이 읽기 전용 데이터를 100% 공유하고, 컨테이너 안에서 많이 쓰는 데이터나 컨테이너 사이에 공유할 데이터는 볼륨을 쓰라고 한다. 이 문서들은 전통적인 overlay2 드라이버를 다루며, containerd 이미지 스토어는 overlayfs 스냅샷터를 쓴다고 구분한다.
(실험 확인) Docker Engine 29.6.1(Docker Desktop, containerd 이미지 스토어)에서 `/etc/passwd` 에 한 줄을 덧붙이고 `/etc/extra` 를 만들고 `/bin/ls` 를 지운 컨테이너의 `docker diff` 는 `C /etc`, `A /etc/extra`, `C /etc/passwd`, `C /bin`, `D /bin/ls` 였다(2026-10-27 재실행. 수정한 파일이 컨테이너 레이어에 복사돼 `C`로 보인다). 컨테이너 안 `/proc/mounts` 는 `overlay / overlay rw,relatime,lowerdir=…:…,upperdir=…,workdir=…` 였고 lowerdir가 두 개였다. 같은 이미지로 새로 띄운 컨테이너의 `/etc/passwd` 마지막 줄은 원래의 `nobody` 줄이고 `/bin/ls` 도 그대로 있어서 이미지 레이어는 바뀌지 않았다. 반례로 볼륨(`-v`)에 쓴 파일은 `docker diff` 에 나오지 않았고(마운트 지점 `A /data` 만 보였다) 볼륨 쓰기는 컨테이너 레이어를 거치지 않는다. 큰 파일의 `copy_up` 지연은 측정하지 않았다.
