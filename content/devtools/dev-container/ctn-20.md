---
slug: "ctn-20"
topic: "dev-container"
tier: DEEP
difficulty: 2
title: "공개 레지스트리의 이미지를 베이스로 쓸 때 어떤 보안 위험이 있고 어떻게 줄이나요? SBOM과 provenance는 무엇인가요?"
keywords: ["출처가 확인된 베이스 이미지", "최소한의 작은 이미지", "다이제스트 고정과 자동 갱신", "SBOM은 포함된 구성 요소 목록", "provenance는 빌드 방법 기록"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.docker.com/build/building/best-practices/", "https://docs.docker.com/build/metadata/attestations/", "https://docs.docker.com/build/metadata/attestations/sbom/", "https://docs.docker.com/build/metadata/attestations/slsa-provenance/", "https://docs.docker.com/engine/security/trust/"]
concepts: [container-hardening, container-image]
importance: 2
links: [{to: "dkr-18", kind: RELATED}, {to: "ctn-07", kind: RELATED}]
---
**모범 답변 (30~60초)**
공개 레지스트리의 이미지는 누가 만들었고 무엇이 들어 있는지 확인하지 않고 쓰면 공급망 위험이 되므로, 우선 Docker Official Images나 Verified Publisher처럼 출처가 확인되는 최소한의 작은 베이스를 고릅니다. 태그는 바뀔 수 있으니 다이제스트로 고정하고 Dependabot 같은 도구로 갱신 PR을 받아 변경 이력과 보안 패치를 함께 챙깁니다. BuildKit이 빌드 때 붙이는 증명(attestation) 중 SBOM은 이미지에 든 소프트웨어 구성 요소 목록이고 provenance는 이미지가 어떻게 빌드됐는지의 기록이라서, 취약점 점검과 정책 검증에 쓸 수 있습니다.

```bash
docker build -t myimg .           # 기본으로 provenance 증명이 이미지 인덱스에 붙는다
docker save myimg -o myimg.tar    # index.json 과 blobs/ 를 열어 attestation-manifest 확인
```

(공식 문서) Docker best-practices 문서는 베이스 이미지를 고를 때 신뢰할 수 있는 출처의 작은 이미지를 고르라고 하며, Docker Official Images, Verified Publisher 이미지, Docker-Sponsored Open Source를 예로 든다. 태그는 mutable이라 다이제스트로 고정하면 같은 이미지를 보장하지만 자동 보안 수정은 포기하게 되므로 Dependabot으로 갱신 PR을 받는 것이 낫다고 한다. Build attestations 문서는 attestation을 BuildKit이 빌드할 때 만들어 이미지에 메타데이터로 붙이고, SBOM(이미지가 담거나 빌드에 쓰인 소프트웨어 구성 요소 목록)과 provenance(이미지가 어떻게 빌드됐는지)가 있으며, mode=min 수준의 provenance는 기본으로 붙고 SBOM은 `--sbom=true` 로 켜야 한다고 한다. attestation은 in-toto JSON으로 감싸 이미지 인덱스에 붙는다. Docker Content Trust 문서는 서명으로 이미지 태그의 무결성과 게시자를 검증하는 기능을 설명하면서, DCT가 폐기되는 중이고 Notary v1 서비스가 2026년 12월 8일에 종료된다고 경고한다.
(실험 확인) Docker Engine 29.6.1(buildx v0.35.0-desktop.2)에서 `FROM busybox:1.36` 이미지를 `docker build` 해 `docker save` 하자(2026-10-27 재실행) 최상위 `index.json` 이 가리키는 이미지 인덱스 안에 플랫폼 매니페스트(arm64)와 함께 `vnd.docker.reference.type: attestation-manifest` 매니페스트가 있었고, 그 레이어는 `application/vnd.in-toto+json` 이며 predicate 종류는 `https://slsa.dev/provenance/v1` 이었다(문서는 provenance 스키마 기본을 v0.2라고 하지만 이 환경의 기본 결과는 v1이었다). 받아 둔 `busybox:1.36` 도 저장해 보니 SPDX 2.3 SBOM(in-toto, `https://spdx.dev/Document`)이 attestation으로 붙어 있었다. `--sbom=true` 빌드는 스캐너 이미지를 받아야 해서 실행하지 않았고, 서명 검증(DCT 등)도 실행하지 않았다.
