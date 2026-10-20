---
slug: "dkr-02"
topic: "dev-docker"
tier: BASIC
difficulty: 1
title: "도커 이미지와 컨테이너는 어떤 관계이고, 이미지 레이어는 컨테이너에서 어떻게 쓰이나요?"
keywords: ["이미지는 불변 패키지", "컨테이너는 실행 인스턴스", "읽기 전용 이미지 레이어", "컨테이너별 쓰기 가능 레이어", "컨테이너 삭제 시 데이터 소멸"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-an-image/", "https://docs.docker.com/get-started/docker-concepts/building-images/understanding-image-layers/", "https://docs.docker.com/engine/storage/", "https://docs.docker.com/get-started/docker-overview/"]
concepts: [container]
importance: 3
links: [{to: "dkr-08", kind: FOLLOWUP}, {to: "dkr-19", kind: FOLLOWUP}, {to: "dkr-01", kind: PREREQ}]
---
**모범 답변 (30~60초)**
이미지는 컨테이너 실행에 필요한 파일, 바이너리, 설정을 묶어 둔 불변의 패키지이고, 컨테이너는 그 이미지로 실행한 인스턴스입니다. 이미지는 파일 시스템의 추가·수정·삭제 변경분을 담은 읽기 전용 레이어가 쌓인 구조입니다. 컨테이너를 만들면 그 위에 컨테이너 전용의 쓰기 가능한 레이어가 하나 생겨서 컨테이너 안에서 만든 파일은 거기에 저장되고, 원본 이미지 레이어는 그대로입니다. 그래서 같은 이미지로 컨테이너를 여러 개 띄울 수 있고, 컨테이너를 삭제하면 쓰기 레이어의 데이터도 함께 사라집니다.

```bash
docker run -d --name c1 busybox:1.36 sh -c 'echo hello > /data.txt; sleep 300'
docker diff c1                          # A /data.txt
docker run --rm busybox:1.36 ls /data.txt   # 다른 컨테이너에는 없다
```

(공식 문서) What is an image 페이지는 이미지가 불변이고 레이어로 구성되며 각 레이어는 파일을 추가·삭제·수정하는 변경 묶음이라고 한다. Understanding the image layers 페이지는 컨테이너를 실행하면 레이어들이 쌓인 유니온 파일 시스템이 만들어지고, 그와 함께 실행 중인 컨테이너 전용 디렉터리가 만들어져 원본 이미지 레이어를 건드리지 않고 파일을 바꿀 수 있어서 같은 이미지로 컨테이너를 여러 개 실행할 수 있다고 설명한다. Docker overview 는 컨테이너 생성 시 최종 레이어로 읽기·쓰기 파일 시스템이 할당되고, 컨테이너를 삭제하면 영속 저장소에 두지 않은 상태 변경은 사라진다고 한다. Docker storage 페이지는 컨테이너 안에서 만든 파일이 이미지의 읽기 전용 레이어 위에 있는 쓰기 가능 컨테이너 레이어에 저장되고, 이 데이터는 컨테이너가 삭제되면 남지 않으며 쓰기 레이어는 컨테이너마다 고유하다고 한다.
(실험 확인) Docker Engine 29.6.1에서 busybox:1.36 컨테이너 안에서 `/data.txt` 를 만들면 `docker diff` 에 `A /data.txt` 가 나왔다. 같은 이미지로 띄운 다른 컨테이너에는 `/data.txt` 가 없었고, 파일을 만든 컨테이너를 `docker rm -f` 로 지운 뒤 새로 띄운 컨테이너에도 없었다. `docker image inspect` 의 `RootFS.Layers` 개수는 busybox:1.36이 1개, nginx:1.27-alpine이 8개였다.
