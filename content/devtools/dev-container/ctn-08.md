---
slug: "ctn-08"
topic: "dev-container"
tier: DEEP
difficulty: 2
title: "OCI 이미지는 실제로 무엇으로 이뤄져 있고, 이미지 인덱스·매니페스트·설정·레이어는 어떻게 연결되나요?"
keywords: ["인덱스·매니페스트·설정·레이어", "매니페스트가 설정과 레이어를 참조", "모든 참조는 digest(내용 주소)", "레이어는 변경분 tar", "삭제는 whiteout 파일"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://raw.githubusercontent.com/opencontainers/image-spec/main/spec.md", "https://raw.githubusercontent.com/opencontainers/image-spec/main/manifest.md", "https://raw.githubusercontent.com/opencontainers/image-spec/main/image-index.md", "https://raw.githubusercontent.com/opencontainers/image-spec/main/layer.md", "https://raw.githubusercontent.com/opencontainers/image-spec/main/config.md", "https://raw.githubusercontent.com/opencontainers/image-spec/main/descriptor.md"]
concepts: [container-image]
importance: 1
links: [{to: "ctn-04", kind: PREREQ}, {to: "ctn-10", kind: FOLLOWUP}, {to: "dkr-02", kind: RELATED}]
---
**모범 답변 (30~60초)**
OCI 이미지는 해시로 서로를 가리키는 파일들의 묶음입니다. 맨 위의 이미지 인덱스는 플랫폼별 매니페스트 목록이고, 매니페스트는 설정 하나와 레이어 목록을 각각 크기와 digest가 든 디스크립터로 가리킵니다. 설정 JSON에는 Entrypoint, Cmd, Env 같은 실행 기본값과 레이어 해시 목록, 빌드 이력이 있고, 레이어는 파일 변경분을 담은 tar 아카이브입니다. 모든 참조가 내용의 digest라서 받은 뒤 해시로 변조 여부를 검증할 수 있습니다. 삭제는 레이어 안에 whiteout이라는 표시 파일로 기록됩니다.

```bash
docker save --platform linux/arm64 busybox:1.36 -o busybox.tar && mkdir save && tar -xf busybox.tar -C save
cat save/index.json          # index -> manifest digest
ls save/blobs/sha256         # 파일 이름 = 내용의 sha256
```

```dockerfile
FROM busybox:1.36
RUN echo one > /a.txt
ENV FOO=bar
RUN echo two > /b.txt
RUN rm /a.txt
CMD ["cat","/b.txt"]
```

(공식 문서) OCI image-spec은 매니페스트를 단일 이미지의 설정 하나와 레이어 목록으로, 이미지 인덱스를 여러 매니페스트(플랫폼별 변형 등)를 가리키는 상위 매니페스트로 설명한다. `layers[0]` 이 베이스 레이어이고 순서대로 적용한 결과가 최종 파일시스템이다. 구성 요소 사이의 참조는 디스크립터(mediaType, digest, size)로 표현되고, 신뢰할 수 없는 출처에서 받은 내용은 digest로 검증해야 하며 길이가 크기와 다르면 신뢰하지 말라고 한다. 레이어는 변경분(추가·수정·삭제)을 담은 tar이고 삭제는 `.wh.` 접두어가 붙은 빈 whiteout 파일로 표현한다. 설정은 Entrypoint·Cmd·Env 같은 실행 기본값, `rootfs.diff_ids`, `history` 를 담고, 파일시스템을 바꾸지 않은 단계(예: `ENV`)는 `history` 에서 `empty_layer` 로 표시한다.
(실험 확인) Docker Engine 29.6.1에서 `docker save --platform linux/arm64 busybox:1.36` 의 `index.json` 은 플랫폼 매니페스트(610바이트, arm64/v8)와 증명 매니페스트(559바이트)를 가리켰고, 플랫폼 매니페스트는 설정(477바이트, `Cmd: ["sh"]`, `rootfs.diff_ids` 1개, `history` 1개)과 `application/vnd.oci.image.layer.v1.tar+gzip` 레이어 1개(1,896,265바이트)를 가리켰다(2026-10-27 재실행). `blobs/sha256/` 의 6개 파일(위 3개와 증명용 매니페스트·설정·내용) 모두 파일 이름이 내용의 sha256과 같았다(파이썬 `hashlib` 으로 확인). 위 Dockerfile로 만든 이미지는 `rootfs.diff_ids` 가 4개(베이스 1 + `RUN` 3)였고 `history` 6개 중 `ENV` 와 `CMD` 만 `empty_layer: true` 였다. 마지막 `RUN rm /a.txt` 레이어 tar에는 `.wh.a.txt` 라는 항목 하나뿐이었고, 앞 레이어 tar에는 `a.txt` 가 그대로 들어 있었다. 그 이미지의 blob 6개도 모두 이름과 sha256이 일치했다.
