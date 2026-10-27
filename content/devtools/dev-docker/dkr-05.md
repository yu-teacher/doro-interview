---
slug: "dkr-05"
topic: "dev-docker"
tier: BASIC
difficulty: 2
title: "Dockerfile의 ENV와 ARG는 무엇이 다르고, 비밀 값을 넣어도 되나요?"
keywords: ["ARG는 빌드 시점 변수", "ENV는 컨테이너에도 유지", "--build-arg로 전달", "docker history에 값 노출", "비밀 값은 secret 마운트"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.docker.com/reference/dockerfile/", "https://docs.docker.com/build/building/best-practices/", "https://docs.docker.com/build/building/secrets/", "https://docs.docker.com/reference/build-checks/secrets-used-in-arg-or-env/"]
concepts: [container, externalized-config]
importance: 2
links: [{to: "cic-06", kind: RELATED}, {to: "arc-12", kind: RELATED}]
---
**모범 답변 (30~60초)**
ARG는 `docker build --build-arg` 로 넘기는 빌드 시점 변수로, 최종 이미지와 컨테이너 환경에는 남지 않습니다. ENV는 이미지에 기록되어 컨테이너를 실행할 때도 환경 변수로 존재하고 `docker run -e` 로 덮어쓸 수 있습니다. 둘 다 비밀번호나 토큰 같은 비밀을 넣는 용도로는 쓰면 안 됩니다. ARG 값은 `docker history` 에서 보이고, ENV도 이미지에 그대로 남아 `docker inspect` 로 조회되기 때문입니다. 빌드 중 필요한 비밀은 `RUN --mount=type=secret` 을 쓰라고 공식 문서가 안내합니다.

```dockerfile
FROM busybox:1.36
ARG BUILD_MODE=dev
ENV APP_ENV=prod
RUN echo "mode=$BUILD_MODE" > /mode.txt
CMD ["sh","-c","echo APP_ENV=$APP_ENV BUILD_MODE=$BUILD_MODE; cat /mode.txt"]
```

(공식 문서) Dockerfile 레퍼런스는 ARG가 빌드 시 `--build-arg` 로 넘기는 변수이고, ENV와 달리 최종 이미지에 박히지 않으며 최종 컨테이너에서도 쓸 수 없다고 한다. 또 빌드 인자로 사용자 자격 증명이나 API 토큰 같은 비밀을 넘기는 것은 권장하지 않으며, 빌드 인자는 `docker history` 와 provenance 증명에서 보이므로 안전한 방법은 `RUN --mount=type=secret` 절을 보라고 한다. ENV는 컨테이너 실행 시에도 유지되고 `docker inspect` 로 값을 볼 수 있으며 `docker run --env` 로 바꿀 수 있고, 빌드 중에만 필요한 값은 ARG나 단일 명령 안의 변수로 쓰라고 한다. best-practices 페이지는 ENV 한 줄도 레이어를 만들어서 뒤에서 `unset` 해도 그 레이어에 값이 남는다고 한다.
(실험 확인) 위 Dockerfile을 `--build-arg BUILD_MODE=release` 로 빌드해 실행하면 `APP_ENV=prod BUILD_MODE=` (ARG는 실행 시 비어 있음)에 이어 빌드 중 만든 `/mode.txt` 의 `mode=release` 가 나왔고, `docker run -e APP_ENV=staging` 으로 ENV를 덮어쓸 수 있었다. `docker image inspect` 의 `Config.Env` 에는 `APP_ENV=prod` 만 있었고, `docker history --no-trunc` 에는 `ARG BUILD_MODE=release` 와 `RUN |2 BUILD_MODE=release API_TOKEN=... ` 처럼 빌드 인자 값이 그대로 보였다(실험에는 위 Dockerfile에 `ARG API_TOKEN` 한 줄을 더하고 가짜 값을 `--build-arg` 로 넘겼다).
(공식 문서) Docker 빌드 시크릿 문서는 빌드 인자와 환경 변수가 비밀 전달에 적절하지 않다고 하고, 빌드 검사 문서도 비밀을 `ARG`나 `ENV`에 쓰지 말라고 한다. (보충) ENV가 이미지에 남아 `docker inspect` 로 보인다는 설명과, ENV 레이어에는 뒤에서 `unset` 해도 값이 남는다는 best-practices 설명에서 이끌어 낸 일반 설명이다. Docker Engine 29.6.1.
