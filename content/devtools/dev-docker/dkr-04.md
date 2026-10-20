---
slug: "dkr-04"
topic: "dev-docker"
tier: BASIC
difficulty: 1
title: "Dockerfile에서 COPY와 ADD는 어떻게 다르고, 어느 쪽을 기본으로 써야 하나요?"
keywords: ["COPY는 단순 복사", "ADD는 URL·Git 지원", "로컬 tar 자동 해제", "기본은 COPY", "멀티 스테이지 COPY --from"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.docker.com/build/building/best-practices/", "https://docs.docker.com/reference/dockerfile/"]
concepts: [container]
importance: 1
links: [{to: "dkr-02", kind: PREREQ}]
---
**모범 답변 (30~60초)**
둘 다 빌드 컨텍스트의 파일을 이미지로 넣지만, COPY는 단순 복사만 하고 ADD는 원격 HTTPS URL이나 Git 저장소에서 가져오는 기능과 컨텍스트의 로컬 tar 파일을 자동으로 푸는 기능까지 합니다. 공식 문서는 멀티 스테이지에서 단계 사이 복사에는 대체로 COPY를 쓰라고 하고, ADD는 원격 아티팩트를 내려받는 것처럼 그 기능이 필요할 때 가장 좋다고 합니다. 그래서 단순 복사는 COPY를 기본으로 둡니다. 멀티 스테이지에서 앞 단계의 결과물을 가져올 때도 `COPY --from` 을 씁니다. ADD는 내려받은 파일의 체크섬을 검증하는 `--checksum` 옵션도 지원합니다.

```dockerfile
FROM busybox:1.36
COPY pkg.tgz /copied/
ADD pkg.tgz /added/
```

(공식 문서) best-practices 페이지의 ADD or COPY 절은 COPY가 빌드 컨텍스트나 멀티 스테이지의 다른 단계에서 기본적인 복사를 하고, ADD는 원격 HTTPS·Git URL에서 파일을 가져오는 기능과 빌드 컨텍스트의 tar 파일을 자동으로 푸는 기능을 지원한다고 한다. 멀티 스테이지에서 단계 사이 복사에는 대체로 COPY를 쓰고, ADD는 빌드 중 원격 아티팩트를 내려받을 때 가장 좋으며 정확한 빌드 캐시와 체크섬 검증을 제공한다고 한다. Dockerfile 레퍼런스는 ADD의 소스가 로컬 tar 아카이브면 압축을 풀어 대상에 추출하고, URL이면 내려받아 대상에 둔다고 한다.
(실험 확인) 로컬 `pkg.tgz`(안에 `inner.txt`)를 위 Dockerfile로 빌드해 `ls -R` 하니 COPY 대상 `/copied/` 에는 `pkg.tgz` 가 그대로 있었고, ADD 대상 `/added/` 에는 압축이 풀린 `inner.txt` 가 있었다. 외부 네트워크 접속이 필요한 ADD URL 동작은 실험하지 않았다.
(보충) "단순 복사는 COPY를 기본으로 둔다"는 말은 문서가 단계 사이 복사에 COPY를 권하고 ADD는 원격 아티팩트에 가장 좋다고 한 데서 이끌어 낸 일반 정리이며, 문서가 "COPY가 기본"이라고 직접 쓰지는 않는다.
