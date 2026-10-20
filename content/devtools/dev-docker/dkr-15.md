---
slug: "dkr-15"
topic: "dev-docker"
tier: DEEP
difficulty: 2
title: "컨테이너 로그는 어디로 어떻게 남기고, 기본 로깅 드라이버를 쓸 때 주의할 점은 무엇인가요?"
keywords: ["stdout·stderr 수집", "docker logs", "기본 json-file 드라이버", "로그 로테이션 없음", "max-size와 max-file"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.docker.com/engine/logging/configure/", "https://docs.docker.com/reference/cli/docker/container/logs/", "https://docs.docker.com/engine/logging/drivers/json-file/"]
---
**모범 답변 (30~60초)**
Docker는 컨테이너의 표준 출력과 표준 에러를 로깅 드라이버로 수집하고, `docker logs` 로 그 내용을 볼 수 있습니다. 그래서 컨테이너 안의 앱은 로그를 파일이 아니라 표준 출력으로 내보내는 것이 맞습니다. 기본 드라이버인 `json-file` 은 기본 설정에서 로그 로테이션을 하지 않아서, 출력이 많은 컨테이너는 호스트 디스크를 많이 차지할 수 있습니다. 공식 문서는 `max-size` 와 `max-file` 옵션으로 로테이션을 켜거나 기본으로 로테이션을 하는 `local` 드라이버를 쓰라고 안내합니다. 또 컨테이너를 삭제하면 그 로그도 더는 볼 수 없습니다.

```bash
docker run -d --log-opt max-size=20k --log-opt max-file=2 busybox:1.36 sh -c '...'
docker inspect <컨테이너> --format '{{json .HostConfig.LogConfig}}'
```

(공식 문서) Configure logging drivers 페이지는 데몬마다 기본 로깅 드라이버가 있고 기본은 `json-file` 이며, 기본 설정은 로그 로테이션을 하지 않아 출력이 많은 컨테이너는 디스크를 고갈시킬 수 있다고 한다. 이전 버전과의 호환 때문에 `json-file` 이 기본으로 남아 있고, 그 외의 경우에는 기본으로 로테이션을 하고 더 효율적인 파일 형식을 쓰는 `local` 드라이버를 권장한다고 한다. `daemon.json` 의 `log-driver` 와 `log-opts`(`max-size`, `max-file` 등)로 기본값을 바꿀 수 있고 이미 만든 컨테이너에는 적용되지 않으며, 컨테이너별로 `--log-driver`·`--log-opt` 로 바꿀 수 있다고 한다. json-file 드라이버 페이지는 `max-size` 와 `max-file` 로 자동 로테이션을 켠다고 하며, `max-size` 기본값은 -1(무제한), `max-file` 은 `max-size` 도 설정해야 효과가 있다고 한다. `docker logs` 레퍼런스는 이 명령이 컨테이너의 STDOUT과 STDERR 출력을 보여 준다고 한다.
(실험 확인) Docker Engine 29.6.1에서 표준 출력, 표준 에러, `/tmp/app.log` 파일에 각각 한 줄씩 쓴 컨테이너의 `docker logs` 에는 표준 출력과 표준 에러 줄만 나왔고 파일 내용은 없었다. 컨테이너의 `LogConfig` 는 `json-file` 이었다. 같은 출력을 내는 컨테이너 둘을 비교하니, `--log-opt max-size=20k --log-opt max-file=2` 를 준 쪽은 `docker logs` 로 9,800바이트(첫 줄이 `line 29720`)만 남았고, 옵션을 안 준 쪽은 1,038,890바이트 전체(첫 줄이 `line 0`)가 남았다(2026-10-20 재실행, 줄 수와 바이트는 실행마다 다르다). nginx:1.27-alpine의 `/var/log/nginx/access.log` 와 `error.log` 는 각각 `/dev/stdout`, `/dev/stderr` 로의 심볼릭 링크였다. 컨테이너를 `docker rm` 한 뒤 `docker logs` 는 `No such container` 였다.
(보충) "앱은 로그를 표준 출력으로 내보내는 것이 맞다"는 말은 Docker가 표준 출력·에러를 수집한다는 사실에서 나온 일반적인 권장이며 공식 문서의 직접 문구는 아니다. 컨테이너가 사라져도 로그를 보존하려면 외부 수집 구성이 필요하다는 것도 일반 설명이다.
