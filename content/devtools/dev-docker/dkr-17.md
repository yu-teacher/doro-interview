---
slug: "dkr-17"
topic: "dev-docker"
tier: TRICKY
difficulty: 2
title: "컨테이너를 root로 실행하면 왜 위험하고, 비루트 사용자로 실행하려면 어떻게 하나요?"
keywords: ["기본 사용자는 root", "USER로 비루트 전환", "침해 시 영향 축소", "capability 제한", "명시적 UID와 GID"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.docker.com/engine/security/", "https://docs.docker.com/build/building/best-practices/", "https://docs.docker.com/reference/dockerfile/", "https://docs.docker.com/engine/security/rootless/"]
concepts: [container]
importance: 1
links: [{to: "dkr-02", kind: PREREQ}]
---
**모범 답변 (30~60초)**
컨테이너의 프로세스는 기본적으로 root로 실행됩니다. 공식 문서는 Docker가 기본으로 capability를 제한해서 컨테이너 안의 root도 호스트의 진짜 root보다 권한이 훨씬 적다고 하지만, 서비스가 권한 없이 돌 수 있으면 비루트 사용자로 실행하는 것이 안전하다고 안내합니다. Dockerfile에서 사용자를 만든 뒤 `USER` 로 전환하면 이후의 `RUN` 과 실행 시 ENTRYPOINT·CMD가 그 사용자로 동작하고, 필요하면 UID와 GID를 명시합니다. 1024 미만 포트를 쓰려는 정도라면 root 대신 필요한 capability만 주는 방법이 있습니다.

```dockerfile
FROM busybox:1.36
RUN addgroup -g 10001 -S app && adduser -S -u 10001 -G app app
WORKDIR /app
RUN chown app:app /app
USER app
CMD ["sh","-c","id; touch /app/ok && echo wrote-app-dir; touch /etc/x || true"]
```

(공식 문서) Docker security 페이지는 Docker가 기본으로 제한된 capability 집합으로 컨테이너를 시작하고(허용 목록 방식), 1024 미만 포트 바인딩만 필요한 프로세스는 root 대신 `net_bind_service` capability만 주면 되며, 컨테이너 안의 root는 mount 거부, raw 소켓 접근 거부, 모듈 로딩 거부 등으로 진짜 root보다 권한이 훨씬 적다고 한다. 결론으로 컨테이너 안에서 권한 없는 사용자로 프로세스를 실행하면 기본적으로 꽤 안전하다고 한다. best-practices 페이지의 USER 절은 서비스가 권한 없이 실행될 수 있으면 `USER` 로 비루트 사용자로 바꾸고, 이미지 재빌드 때 UID/GID가 달라질 수 있으니 중요하면 명시하라고 한다. Dockerfile 레퍼런스는 `USER` 가 이후의 `RUN` 과 런타임의 ENTRYPOINT·CMD에 쓸 사용자를 정한다고 한다. Rootless mode 페이지는 데몬과 컨테이너를 비루트 사용자로 실행하는 별도 모드를 설명한다.
(실험 확인) Docker Engine 29.6.1, busybox:1.36에서 `docker run busybox:1.36 id` 는 `uid=0(root)` 였고, `--user 1000:1000` 으로 `/` 에 파일을 만들면 `Permission denied` 였다. 기본 root의 유효 capability 값(`CapEff`)은 `00000000a80425fb`, `--privileged` 는 `000001ffffffffff` 로 달랐고(Docker Desktop 리눅스 VM 기준이며 값은 환경에 따라 다를 수 있다), 기본 root도 `mount -t tmpfs` 는 `permission denied` 였다. 위 Dockerfile의 컨테이너는 `uid=10001(app)` 으로 실행되어 소유권을 준 `/app` 에는 쓸 수 있었고 `/etc` 에는 `Permission denied` 였다. 위 `addgroup`·`adduser` 형식은 busybox용이고 공식 문서 예시는 Debian 계열의 `groupadd`·`useradd` 이다.
(보충) "컨테이너의 프로세스는 기본적으로 root로 실행된다"는 문장은 읽은 Docker 문서에서 직접 찾지 못했다. best-practices의 "권한 없이 실행될 수 있으면 `USER` 로 비루트로 바꾸라"는 안내와 위 실험(`id` 가 `uid=0`)에서 이끌어 낸 설명이다.
