---
slug: "dkr-03"
topic: "dev-docker"
tier: BASIC
difficulty: 2
title: "Dockerfile의 RUN, CMD, ENTRYPOINT는 어떻게 다른가요?"
keywords: ["RUN은 빌드 시 실행", "CMD는 기본 실행 명령", "ENTRYPOINT는 고정 실행 파일", "run 인자는 CMD를 대체", "exec 형식 JSON 배열"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.docker.com/reference/dockerfile/", "https://docs.docker.com/build/building/best-practices/"]
concepts: [container]
importance: 3
links: [{to: "dkr-16", kind: FOLLOWUP}, {to: "dkr-02", kind: PREREQ}]
---
**모범 답변 (30~60초)**
RUN은 이미지를 빌드할 때 실행되어 결과가 레이어로 남고, CMD와 ENTRYPOINT는 컨테이너를 시작할 때 무엇을 실행할지 정합니다. CMD는 기본값이라 `docker run` 뒤에 명령을 주면 통째로 대체됩니다. ENTRYPOINT는 컨테이너를 하나의 실행 파일처럼 쓰게 하는 고정된 시작점이라 `docker run` 인자가 그 뒤에 붙고, 바꾸려면 `--entrypoint` 를 써야 합니다. 둘을 함께 쓰면 ENTRYPOINT가 실행 파일, CMD가 기본 인자가 되며 이때는 둘 다 JSON 배열인 exec 형식으로 씁니다.

```dockerfile
FROM busybox:1.36
ENTRYPOINT ["echo", "entry"]
CMD ["default-arg"]
```

(공식 문서) Dockerfile 레퍼런스는 CMD가 컨테이너 실행 시 쓸 기본값을 주며, Dockerfile에 CMD는 하나만 유효하고(여러 개면 마지막), `docker run` 에 인자를 주면 CMD 기본값을 덮어쓴다고 한다. RUN은 실제로 실행해 결과를 커밋하지만 CMD는 빌드 시 아무것도 실행하지 않는다고 구분한다. ENTRYPOINT는 컨테이너를 실행 파일처럼 설정하는 것이고, `docker run <image>` 의 인자는 exec 형식 ENTRYPOINT 뒤에 붙고 CMD는 모두 덮어쓰며, `--entrypoint` 플래그로 ENTRYPOINT를 덮어쓸 수 있다고 한다. CMD를 ENTRYPOINT의 기본 인자로 쓸 때는 둘 다 exec 형식으로 써야 한다고 한다. best-practices 페이지는 ENTRYPOINT의 가장 좋은 용도가 이미지의 주 명령을 정하는 것이고 CMD는 기본 플래그로 쓰는 것이라고 한다.
(실험 확인) 위 Dockerfile로 빌드한 이미지는 인자 없이 실행하면 `entry default-arg`, `docker run <이미지> other` 는 `entry other`(CMD만 교체), `docker run --entrypoint echo <이미지> replaced` 는 `replaced` 를 출력했다(Docker Engine 29.6.1).
