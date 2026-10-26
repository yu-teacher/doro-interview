---
slug: "ctn-10"
topic: "dev-container"
tier: TRICKY
difficulty: 3
title: "한 이미지에 이미지 ID, 매니페스트 digest, 설정 digest, 레이어 digest, `diff_id`가 모두 다른데, 각각 무엇을 해시한 값인가요?"
keywords: ["인덱스·매니페스트 digest는 JSON의 해시", "설정 digest는 설정 JSON의 해시", "레이어 digest는 blob(보통 압축본)의 해시", "DiffID는 압축 전 tar의 해시", "이미지 ID 정의는 구현마다 다름"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://raw.githubusercontent.com/opencontainers/image-spec/main/config.md", "https://raw.githubusercontent.com/opencontainers/image-spec/main/manifest.md", "https://raw.githubusercontent.com/opencontainers/image-spec/main/layer.md", "https://docs.docker.com/engine/storage/containerd/"]
concepts: [container-image, hash-function]
importance: 1
links: [{to: "ctn-08", kind: PREREQ}]
---
**모범 답변 (30~60초)**
모두 sha256이지만 무엇을 해시했는지가 다릅니다. 태그가 가리키는 것은 인덱스나 매니페스트 JSON의 digest이고, 매니페스트 안의 config digest는 설정 JSON의 해시, layers의 digest는 레이어 blob 자체의 해시라서 흔한 tar+gzip이면 압축한 결과의 해시입니다. 반면 설정의 `rootfs.diff_ids` 에 있는 `diff_id` 는 압축하기 전 tar의 해시여서 압축 방식이 달라도 같습니다. 이미지 ID는 OCI 사양이 더는 정의하지 않아 구현마다 다르고, containerd 이미지 스토어를 쓰는 Docker 29.6.1에서는 인덱스의 digest가 이미지 ID로 나왔습니다.

```bash
docker image inspect busybox:1.36 --format '{{.Id}} {{.Descriptor.digest}} {{json .RootFS.Layers}}'
gunzip -c save/blobs/sha256/<레이어 digest> | shasum -a 256     # 압축을 풀어 해시하면 diff_id
```

(공식 문서) OCI image-spec의 설정 문서는 layer DiffID를 레이어의 압축하지 않은 tar에 대한 digest로 정의하고, 매니페스트에서 자주 쓰이는 레이어 digest(압축된 내용에 대한 것일 수도, 압축하지 않은 내용에 대한 것일 수도 있다)와 혼동하지 말라고 당부한다. 설정은 `rootfs.diff_ids` 로 레이어 해시를 순서대로 적고, 쌓인 레이어 묶음을 가리키는 ChainID는 DiffID들로 재귀적으로 계산한다. 같은 문서는 ImageID가 예전에는 설정 JSON의 SHA256으로 문서화됐지만 구현들이 인덱스나 매니페스트 digest로 OCI 콘텐츠를 다루는 쪽으로 갈라져서 사양이 더는 ImageID 생성 방식을 정의하지 않는다고 한다. 매니페스트 문서는 `config` 와 `layers` 를 모두 digest가 든 디스크립터로 가리킨다고 하고 레이어의 mediaType으로 `tar` 와 `tar+gzip` 을 반드시 지원해야 한다고 하며, 레이어 문서는 `tar+zstd` 도 정의한다. Docker 문서는 Engine 29.0 이상의 새 설치에서 containerd 이미지 스토어가 기본이라고 한다.
(실험 확인) Docker Engine 29.6.1에서 `busybox:1.36`(arm64) 하나에 서로 다른 다섯 값이 나왔다(2026-10-27 재실행). 이미지 ID `sha256:73aaf090…` 는 `Descriptor.digest`(인덱스 `application/vnd.oci.image.index.v1+json`)와 같았고 그 인덱스 blob의 sha256도 같았다. 플랫폼 매니페스트는 `bd44eb13…`, 설정은 `b7c873bd…`, 압축된 레이어 blob은 `821d9daf…` 였고 각각 파일의 sha256이 digest와 일치했다. 레이어 blob을 `gunzip` 해 해시하자 `6d0cc19a…` 가 나왔고 이것이 `docker image inspect` 의 `RootFS.Layers[0]` 이자 설정의 `diff_ids[0]` 과 같았다. 반례로 같은 내용을 gzip 레벨 1·9로 다시 압축하면 blob 해시가 `5b1737d5…`·`81f0f413…` 으로 바뀌지만 풀어서 해시하면 모두 `6d0cc19a…` 로 같았다. 또 `docker buildx build --output type=oci,compression=uncompressed` 로 만든 새 레이어(mediaType `application/vnd.oci.image.layer.v1.tar`)는 layer digest가 `diff_id` 와 같았고, 재사용한 베이스 레이어는 `tar+gzip` 이라 달랐다. 즉 layer digest가 압축본의 해시인 것은 `tar+gzip` 일 때다.
