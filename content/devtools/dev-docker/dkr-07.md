---
slug: "dkr-07"
topic: "dev-docker"
tier: BASIC
difficulty: 2
title: "컨테이너의 데이터를 유지하려면 볼륨, 바인드 마운트, tmpfs 중 무엇을 어떻게 쓰나요?"
keywords: ["쓰기 레이어는 컨테이너 삭제 시 소멸", "볼륨은 Docker가 관리", "바인드 마운트는 호스트 경로 직접 연결", "tmpfs는 메모리에만 저장", "영속화에는 볼륨 권장"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.docker.com/engine/storage/", "https://docs.docker.com/engine/storage/volumes/", "https://docs.docker.com/engine/storage/bind-mounts/", "https://docs.docker.com/engine/storage/tmpfs/", "https://docs.docker.com/get-started/docker-concepts/running-containers/persisting-container-data/"]
concepts: [container]
importance: 2
links: [{to: "dkr-02", kind: PREREQ}]
---
**모범 답변 (30~60초)**
컨테이너 안에서 쓴 파일은 쓰기 가능 레이어에 저장돼 컨테이너를 지우면 사라지므로, 데이터를 남기려면 외부 저장소를 마운트합니다. 볼륨은 Docker가 관리하는 저장소라 컨테이너가 삭제돼도 남고, 공식 문서가 데이터 영속화에 선호하는 방식입니다. 바인드 마운트는 호스트의 특정 경로를 그대로 연결해서 컨테이너가 호스트 파일을 읽고 쓰므로 소스 코드 공유처럼 호스트에서도 파일에 접근해야 할 때 맞습니다. tmpfs는 호스트 메모리에만 저장돼 컨테이너가 멈추면 사라집니다.

```bash
docker volume create vol1
docker run --rm -v vol1:/data busybox:1.36 sh -c 'echo persisted > /data/a.txt'
docker run --rm -v vol1:/data busybox:1.36 cat /data/a.txt   # persisted
```

(공식 문서) Docker storage 페이지는 컨테이너에서 만든 파일은 쓰기 가능 레이어에 있고 컨테이너가 삭제되면 사라진다고 하며, 외부 저장 방식으로 볼륨, 바인드 마운트, tmpfs 마운트를 든다. Volumes 페이지는 볼륨이 Docker가 만들고 관리하며 컨테이너를 삭제해도 데이터가 남고, 컨테이너 데이터 영속화에 선호하는 메커니즘이며, 호스트에서 파일에 접근해야 하면 바인드 마운트를 쓰라고 한다. Bind mounts 페이지는 호스트의 파일이나 디렉터리를 컨테이너에 직접 마운트하고 기본으로 쓰기 가능해서 컨테이너가 호스트 파일 시스템을 바꿀 수 있다고 하며, 용도로 개발 환경과 컨테이너 사이의 소스 코드 공유를 들고, `--mount` 는 호스트 경로가 없으면 오류이고 `-v` 는 없는 경로를 디렉터리로 만들어 준다고 한다. tmpfs 페이지는 호스트 메모리에만 저장되고 컨테이너가 멈추면 사라지며(리눅스에서 쓸 수 있는 세 번째 방식), 메모리 사용량은 컨테이너 메모리 한도에 포함된다고 한다.
(실험 확인) 2026-10-20 재실행(Docker Engine 29.6.1, macOS의 Docker Desktop 리눅스 VM)에서 볼륨 `exp-docker-vol` 에 쓴 파일은 쓴 컨테이너가 끝난 뒤 새 컨테이너에서 `persisted` 로 읽혔다(실험 후 볼륨 삭제). 볼륨 없이 컨테이너 파일 시스템에 쓴 파일은 새 컨테이너에 없었다. 바인드 마운트한 호스트 디렉터리의 파일을 컨테이너가 읽었고 컨테이너가 쓴 파일이 호스트에서 보였다. 없는 호스트 경로를 `--mount type=bind` 로 주니 `bind source path does not exist` 오류가 났고 `-v` 로 주니 호스트에 디렉터리가 만들어졌다. `--tmpfs /scratch` 의 `mount` 출력은 `tmpfs on /scratch type tmpfs` 였다.
