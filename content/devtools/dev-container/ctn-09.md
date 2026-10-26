---
slug: "ctn-09"
topic: "dev-container"
tier: DEEP
difficulty: 2
title: "멀티 아키텍처(멀티 플랫폼) 이미지는 어떤 구조이고, 같은 태그를 amd64와 arm64에서 받으면 어떻게 되나요?"
keywords: ["이미지 인덱스(매니페스트 리스트)", "플랫폼별 매니페스트", "pull 때 호스트 아키텍처에 맞는 변형 선택", "커널·CPU 공유라 아키텍처 일치 필요", "한 태그에 여러 플랫폼 변형"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.docker.com/build/building/multi-platform/", "https://raw.githubusercontent.com/opencontainers/image-spec/main/image-index.md", "https://raw.githubusercontent.com/opencontainers/image-spec/main/media-types.md", "https://docs.docker.com/engine/storage/containerd/"]
concepts: [container-image]
importance: 1
links: [{to: "ctn-07", kind: PREREQ}, {to: "ctn-08", kind: PREREQ}]
---
**모범 답변 (30~60초)**
멀티 플랫폼 이미지는 태그가 가리키는 최상위가 단일 매니페스트가 아니라 이미지 인덱스, Docker 문서의 표현으로는 매니페스트 리스트이고, 인덱스가 linux/amd64, linux/arm64 같은 플랫폼별 매니페스트를 가리킵니다. 받을 때 레지스트리가 인덱스를 주면 Docker가 호스트 아키텍처에 맞는 매니페스트를 골라 그 변형을 받습니다. 컨테이너는 호스트 커널과 CPU 위에서 도는 프로세스라 아키텍처가 다른 이미지는 에뮬레이션 없이는 못 돌리고, 그래서 한 태그에 여러 플랫폼 변형을 묶어 둡니다.

```bash
docker image ls --tree busybox:1.36                     # 태그 아래 플랫폼별 변형
docker run --rm --platform linux/arm64 busybox:1.36 uname -m
docker run --rm --platform linux/amd64 busybox:1.36 uname -m   # 에뮬레이션
```

(공식 문서) Docker의 multi-platform 문서는 컨테이너가 호스트 커널을 공유하므로 컨테이너 안의 코드가 호스트 아키텍처와 맞아야 하고, 그래서 linux/amd64 컨테이너를 arm64 호스트에서 에뮬레이션 없이 돌릴 수 없다고 설명한다. 단일 플랫폼 이미지는 매니페스트 하나가 설정 하나와 레이어 묶음을 가리키지만, 멀티 플랫폼 이미지는 매니페스트 리스트가 여러 매니페스트를 가리키고 각각이 다른 설정과 레이어를 가진다고 한다. 풀 할 때 레지스트리가 매니페스트 리스트를 돌려주면 Docker가 호스트 아키텍처에 맞는 변형을 자동으로 고른다. 멀티 플랫폼 이미지 저장에는 매니페스트 리스트를 지원하는 이미지 스토어가 필요하고, Docker Desktop과 Docker Engine 29.0 이상은 containerd 이미지 스토어를 기본으로 써서 별도 설정이 필요 없다고 한다. OCI image-spec의 인덱스는 각 매니페스트 디스크립터에 `platform`(`architecture`, `os`)을 두며 플랫폼별 대상이면 두는 것을 권장하고, media-types 문서는 OCI 인덱스(`application/vnd.oci.image.index.v1+json`)와 Docker의 `manifest.list.v2` 를 비슷한(related) 스키마로 나란히 적는다.
(실험 확인) Docker Engine 29.6.1(Docker Desktop, arm64)에서 `docker image ls --tree busybox:1.36` 은 태그 아래에 linux/amd64, arm/v5, arm/v6, arm/v7, arm64/v8, 386, ppc64le, riscv64, s390x 아홉 변형을 보여 줬고(2026-10-27 재실행) 내용이 있는 것은 arm64/v8(1.9MB)과 amd64(2.21MB) 둘뿐, 나머지 일곱은 0B였다. `docker image inspect busybox:1.36` 의 `Descriptor.mediaType` 은 `application/vnd.oci.image.index.v1+json` 이고 그 digest가 이미지 ID(`73aaf090…`)와 같았다. 플랫폼 지정 없이 `docker save` 한 tar의 `blobs/sha256/73aaf090…` 는 파일 이름과 sha256이 같은 인덱스였고 항목이 17개였다. `docker run --pull=never --platform linux/arm64 busybox:1.36 uname -m` 은 `aarch64`, `--platform linux/amd64` 는 `x86_64`(에뮬레이션)였다. 호스트 아키텍처에 맞는 변형을 pull 때 자동으로 고르는 동작은 pull을 하지 않아(금지) 재현하지 않았고 문서 근거만 있다.
