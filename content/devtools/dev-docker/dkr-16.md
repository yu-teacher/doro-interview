---
slug: "dkr-16"
topic: "dev-docker"
tier: TRICKY
difficulty: 3
title: "`docker stop`을 했는데 컨테이너가 10초 뒤에 강제 종료되는 이유는 무엇이고, PID 1과 exec 형식은 어떤 관계인가요?"
keywords: ["SIGTERM 후 유예 시간 뒤 SIGKILL", "기본 10초", "PID 1이 신호를 받음", "셸 형식은 신호 미전달", "exec 형식과 --init"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.docker.com/reference/cli/docker/container/stop/", "https://docs.docker.com/reference/dockerfile/", "https://docs.docker.com/reference/cli/docker/container/run/", "https://docs.docker.com/build/building/best-practices/"]
concepts: [container, graceful-shutdown]
importance: 2
links: [{to: "dkr-03", kind: PREREQ}, {to: "cic-19", kind: RELATED}, {to: "cic-14", kind: RELATED}, {to: "ioc-22", kind: RELATED}]
---
**모범 답변 (30~60초)**
`docker stop` 은 컨테이너의 메인 프로세스, 즉 PID 1에 SIGTERM을 보내고, 유예 시간(리눅스 컨테이너 기본 10초) 안에 끝나지 않으면 SIGKILL로 강제 종료합니다. 그런데 셸 형식으로 쓰면 앱이 `/bin/sh -c` 의 자식이 되어 PID 1이 아니고, 공식 문서는 ENTRYPOINT의 셸 형식이 이래서 앱이 SIGTERM을 받지 못한다고 설명합니다. 그래서 ENTRYPOINT와 CMD는 exec 형식으로 쓰고, 래퍼 스크립트에서는 `exec` 로 앱을 실행합니다. 신호 처리와 좀비 프로세스 정리가 필요하면 `--init` 으로 init 프로세스를 PID 1에 둘 수 있습니다.

```dockerfile
FROM busybox:1.36
COPY app.sh /app.sh
CMD /app.sh && echo after      # 셸이 PID 1 로 남는 형태
```

(공식 문서) `docker stop` 레퍼런스는 메인 프로세스가 SIGTERM을 받고 유예 시간 뒤 SIGKILL을 받으며, 첫 신호는 STOPSIGNAL이나 `--stop-signal` 로 바꿀 수 있고, 기본 타임아웃은 리눅스 컨테이너 10초라고 한다. Dockerfile 레퍼런스는 ENTRYPOINT의 셸 형식이 `/bin/sh -c` 의 하위 명령으로 실행되어 신호를 전달하지 않으므로 실행 파일이 PID 1이 아니고 `docker stop` 의 SIGTERM을 받지 못한다고 하며, exec 형식이 권장 형식이고 래퍼 스크립트는 `exec` 로 최종 실행 파일을 실행해야 신호를 받는다고 한다. `docker run` 레퍼런스는 `--init` 이 좀비 프로세스 수거 같은 init 역할을 하는 프로세스를 PID 1로 두며 기본 구현은 tini 기반의 `docker-init` 이라고 한다.
(실험 확인) Docker Engine 29.6.1, busybox:1.36에서 SIGTERM을 받으면 문구를 출력하고 종료하도록 `trap` 을 건 `app.sh` 로 확인했다. `CMD ["/app.sh"]` 는 `docker stop` 이 즉시 끝났고 로그에 `got SIGTERM` 이 있었다. 셸이 남는 `CMD /app.sh && echo after` 는 `docker top` 에 `/bin/sh -c /app.sh && echo after` 가 부모로 보였고, `docker stop` 이 10초 걸렸으며 종료 코드가 137이고 로그에 `got SIGTERM` 이 없었다. 핸들러가 없는 `sleep 300` 이 PID 1이어도 10초 뒤 종료 코드 137이었고, `--init` 을 주면 `docker-init -- sleep 300` 이 PID 1이 되어 즉시 종료(코드 143)됐다. 단일 명령인 `CMD /app.sh` 는 busybox의 `sh` 가 직접 실행해서 신호가 전달됐는데, 셸 종류에 따라 다를 수 있다.
