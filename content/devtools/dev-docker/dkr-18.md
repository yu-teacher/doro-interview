---
slug: "dkr-18"
topic: "dev-docker"
tier: TRICKY
difficulty: 2
title: "이미지 태그 `latest`를 그대로 쓰면 어떤 문제가 생기나요?"
keywords: ["태그 생략 시 latest", "태그는 이동 가능한 라벨", "latest가 최신을 보장하지 않음", "버전 태그와 digest 고정", "재현 가능한 빌드"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.docker.com/build/building/best-practices/", "https://docs.docker.com/get-started/docker-concepts/building-images/build-tag-and-publish-an-image/", "https://docs.docker.com/reference/cli/docker/image/tag/"]
concepts: [container]
importance: 1
links: [{to: "dkr-02", kind: PREREQ}]
---
**모범 답변 (30~60초)**
태그를 생략하면 Docker는 `latest` 를 기본으로 씁니다. 함정은 이름만 보고 항상 가장 최신이라고 믿기 쉽다는 점입니다. 태그는 게시자가 다른 이미지를 가리키도록 옮길 수 있는 라벨일 뿐이라 같은 태그로 다시 빌드하면 내용이 달라질 수 있고, 그러면 빌드 시점마다 결과가 달라지고 어떤 버전을 썼는지 추적하기도 어렵습니다. 그래서 `FROM` 에는 구체적인 버전 태그를 쓰고, 완전히 고정하려면 `@sha256:` digest까지 지정합니다. 다만 digest 고정은 보안 패치의 자동 반영을 포기하는 것이므로 갱신은 도구로 관리해야 합니다.

```bash
docker tag app:1.0 app:latest        # 두 태그가 같은 이미지
# 이후 latest 로만 다시 빌드하면 app:1.0 은 그대로, latest 만 새 이미지를 가리킨다
```

(공식 문서) best-practices 페이지는 이미지 태그가 변경 가능해서 게시자가 태그를 새 이미지로 옮길 수 있으며, 이 때문에 같은 태그로 다시 빌드해도 같은 결과가 보장되지 않아 깨지는 변경이 생길 수 있고 사용한 이미지 버전의 감사 추적도 없다고 한다. 공급망 무결성을 위해 digest로 고정하면(`FROM alpine:3.21@sha256:...`) 태그가 바뀌어도 같은 이미지를 쓰지만 자동 보안 수정을 포기하게 되므로 Dependabot 등으로 갱신을 관리하라고 한다. 태그 관련 페이지는 태그를 주지 않으면 `latest` 가 기본으로 쓰인다고 한다.
(실험 확인) Docker Engine 29.6.1에서 busybox:1.36 기반의 작은 이미지에 `1.0` 태그를 붙이고 `docker tag` 로 `latest` 를 같은 이미지 ID에 붙였다. 내용을 바꿔 `latest` 만 다시 빌드하자 `1.0` 은 이전 ID 그대로 `v1` 을 출력했고 `latest` 는 새 ID로 `v2` 를 출력했으며, 태그를 생략한 `docker run` 도 `v2` 였다. 이어 `1.0` 태그로 다시 빌드하니 `1.0` 이 새 이미지 ID를 가리키도록 옮겨졌다. `FROM` 이 `latest` 를 가리키는 빌드는 이미지 내려받기가 필요해서 실험하지 않았다.
(보충) "latest가 최신을 보장하지 않는다"는 것은 공식 문서에 그 표현이 있어서가 아니라, 태그가 기본값 이름일 뿐이라는 문서 설명과 위 실험에서 나온 일반 설명이다.
