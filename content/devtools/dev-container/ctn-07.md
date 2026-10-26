---
slug: "ctn-07"
topic: "dev-container"
tier: BASIC
difficulty: 2
title: "이미지 태그와 다이제스트(digest)는 어떻게 다르고, 운영 배포에서 다이제스트로 고정하는 이유와 단점은 무엇인가요?"
keywords: ["태그는 옮길 수 있는 이름표", "다이제스트는 내용의 해시", "같은 digest는 같은 이미지", "Pod마다 다른 버전 방지", "자동 보안 패치 포기와 갱신 자동화"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://kubernetes.io/docs/concepts/containers/images/", "https://docs.docker.com/build/building/best-practices/", "https://docs.docker.com/reference/cli/docker/image/pull/", "https://raw.githubusercontent.com/opencontainers/image-spec/main/descriptor.md"]
concepts: [container-image]
importance: 3
links: [{to: "ctn-09", kind: FOLLOWUP}, {to: "dkr-18", kind: RELATED}, {to: "cic-13", kind: RELATED}]
---
**모범 답변 (30~60초)**
태그는 레지스트리에서 다른 이미지를 가리키도록 옮길 수 있는 이름표이고, 다이제스트는 이미지 내용의 해시로 만든 식별자라서 같은 다이제스트는 같은 내용이고 내용이 바뀌면 다이제스트도 바뀝니다. 같은 태그라도 시점에 따라 다른 코드를 받을 수 있지만, 다이제스트로 지정하면 항상 같은 이미지를 받아서 Pod 일부만 새 코드를 도는 상황을 막습니다. 대신 베이스 이미지의 보안 패치가 자동으로 따라오지 않으므로, Dependabot 같은 도구로 다이제스트 갱신을 자동화해 변경 이력을 남기는 방식이 권장됩니다.

```yaml
containers:
- name: app
  image: busybox@sha256:73aaf090f3d85aa34ee199857f03fa3a95c8ede2ffd4cc2cdb5b94e566b11662
# 태그와 같이 쓰면 pull 에는 digest 만 쓰인다: busybox:1.36@sha256:...
```

(공식 문서) Kubernetes 이미지 문서는 다이제스트를 이미지 내용의 해시이자 변하지 않는 식별자로, 태그는 다른 이미지를 가리키도록 옮길 수 있는 것으로 구분한다. 태그를 쓸 때 레지스트리가 태그가 가리키는 코드를 바꾸면 옛 코드와 새 코드를 도는 Pod가 섞일 수 있고, 다이제스트로 지정하면 매번 같은 코드가 실행된다고 한다. 태그와 다이제스트를 함께 쓰면 pull에는 다이제스트만 쓰이고, 다이제스트를 지정하고 `imagePullPolicy` 를 생략하면 `IfNotPresent` 가 기본이 된다. Docker best-practices 문서는 태그가 mutable이라 같은 태그로 다시 빌드하면 다른 버전을 받을 수 있고, `FROM alpine:3.21@sha256:…` 처럼 다이제스트로 고정하면 게시자가 태그를 바꿔도 같은 이미지를 쓰지만 자동 보안 수정을 포기하게 된다고 한다. Dependabot의 `package-ecosystem: "docker"` 로 태그와 다이제스트 갱신 PR을 받으면 언제 어떻게 바뀌었는지 이력이 남는다고 한다. OCI descriptor 문서는 digest를 충돌 저항 해시로 만든 콘텐츠 식별자로 설명하고, 신뢰할 수 없는 출처에서 받은 내용은 digest로 검증해야 한다고 한다. `docker pull` 문서는 이미지를 digest로 받으면 정확히 그 버전을 받는 고정(pin)이 된다고 한다.
(실험 확인) Docker Engine 29.6.1(containerd 이미지 스토어)에서 같은 태그 `exp-containerv-tag:dev` 를 `CMD` 만 바꿔 두 번 빌드하자 이미지 ID가 `sha256:d1d2bf…` 에서 `sha256:5e6e90…` 으로 바뀌었고, `docker run` 은 새 내용(`version-B`)을 출력했으며 이 이름에 대한 `docker image ls` 에는 새 ID 하나만 남았다(2026-10-27 재실행). 반례로 같은 Dockerfile을 바꾸지 않고 다시 빌드해도 ID가 `d1d2bf…` 에서 `8ce043…` 으로 달라졌다(원인은 확인하지 않았다). 즉 같은 digest는 같은 내용이라는 말은 맞지만, 같은 소스를 다시 빌드하면 같은 digest가 나온다는 보장은 없다. Kubernetes v1.36.1에서 `image: busybox@sha256:73aaf090…`(busybox:1.36의 인덱스 digest) Pod는 로컬 이미지를 써서 `digest-ok` 를 출력하고 `Completed` 가 됐고 `imagePullPolicy` 는 `IfNotPresent` 였다. `busybox:1.36@sha256:73aaf090…` 도 같았고, 존재하지 않는 태그를 붙인 `busybox:nonexist@sha256:73aaf090…` 도 정상 실행돼 태그가 달라도 digest 기준으로 이미지가 정해졌다.
