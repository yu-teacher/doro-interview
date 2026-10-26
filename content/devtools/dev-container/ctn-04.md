---
slug: "ctn-04"
topic: "dev-container"
tier: BASIC
difficulty: 1
title: "OCI(Open Container Initiative)는 무엇이고, 이미지 사양·런타임 사양·배포 사양은 각각 무엇을 정하나요?"
keywords: ["컨테이너 이미지·실행 방식의 표준 사양", "이미지 사양: 매니페스트·설정·레이어", "런타임 사양: 번들과 생명주기", "배포 사양: 레지스트리 API", "Docker 이미지가 다른 런타임에서도 실행"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://raw.githubusercontent.com/opencontainers/image-spec/main/spec.md", "https://raw.githubusercontent.com/opencontainers/runtime-spec/main/spec.md", "https://raw.githubusercontent.com/opencontainers/distribution-spec/main/spec.md", "https://kubernetes.io/blog/2022/02/17/dockershim-faq/"]
concepts: [container-image]
importance: 2
links: [{to: "ctn-08", kind: FOLLOWUP}, {to: "ctn-05", kind: RELATED}]
---
**모범 답변 (30~60초)**
OCI(Open Container Initiative)는 컨테이너의 이미지 형식과 실행 방식을 표준 사양으로 정하는 곳이고, 이 표준 덕분에 도구마다 이미지를 따로 만들지 않아도 됩니다. 이미지 사양은 이미지가 매니페스트, 설정, 레이어로 이뤄진 형태를 정하고, 런타임 사양은 root 파일시스템과 `config.json` 으로 된 번들과 컨테이너 실행 생명주기를 정하며, 배포 사양은 레지스트리 내용을 올리고 내려받는 API 프로토콜을 정합니다. 그래서 Docker로 빌드한 이미지를 containerd나 CRI-O 같은 다른 런타임에서도 그대로 실행할 수 있습니다.

```bash
docker save --platform linux/arm64 busybox:1.36 -o b.tar && tar -tf b.tar
# blobs/sha256/<digest> ..., index.json, manifest.json, oci-layout
```

(공식 문서) OCI image-spec은 OCI 이미지를 이미지 매니페스트, (선택) 이미지 인덱스, 파일시스템 레이어 묶음, 설정으로 정의하고 목표를 이미지를 빌드·전송·실행 준비하는 도구 사이의 상호운용으로 적는다. runtime-spec은 컨테이너의 설정, 실행 환경, 생명주기를 명세하고 설정은 `config.json` 으로 둔다고 하며, 번들은 루트의 `config.json` 과 root 파일시스템으로 이뤄진다. distribution-spec은 콘텐츠 배포를 표준화하는 API 프로토콜이며 Docker Registry HTTP API V2에 바탕을 두고 Pull·Push 요구사항을 정의한다. Kubernetes의 dockershim FAQ는 OCI가 컨테이너 도구 사이의 인터페이스를 표준화했고 image-spec과 runtime-spec을 유지하며 runtime-spec의 실제 구현인 runc도 유지한다고 하고, runc가 containerd와 CRI-O의 기본 런타임이며 `docker build` 로 만든 이미지는 모든 CRI 구현에서 동작한다고 한다.
(실험 확인) Docker Engine 29.6.1에서 `docker save --platform linux/arm64 busybox:1.36` 결과 tar에는 `oci-layout`(내용 `{"imageLayoutVersion":"1.0.0"}`), `index.json`, `manifest.json`, `blobs/sha256/` 가 들어 있었다(2026-10-27 재실행). `index.json` 은 `application/vnd.oci.image.index.v1+json` 이고 플랫폼 매니페스트와 증명 매니페스트를 가리켰다. 즉 이 버전(containerd 이미지 스토어)의 저장 형식은 OCI 이미지 레이아웃이다.
