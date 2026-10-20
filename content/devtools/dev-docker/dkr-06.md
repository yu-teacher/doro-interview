---
slug: "dkr-06"
topic: "dev-docker"
tier: BASIC
difficulty: 1
title: "`docker run -p 8080:80`은 무슨 뜻이고, Dockerfile의 EXPOSE와는 어떻게 다른가요?"
keywords: ["-p 호스트포트:컨테이너포트", "EXPOSE는 문서 역할", "발행하지 않으면 외부 접근 불가", "127.0.0.1에만 바인딩", "-P 임의 포트 매핑"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.docker.com/engine/network/port-publishing/", "https://docs.docker.com/reference/dockerfile/", "https://docs.docker.com/engine/network/", "https://docs.docker.com/get-started/docker-concepts/running-containers/publishing-ports/"]
concepts: [container]
importance: 2
links: [{to: "dkr-11", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
`-p 8080:80` 은 호스트의 8080 포트로 들어온 요청을 컨테이너의 80 포트로 전달하는 포트 발행입니다. 포트를 발행하지 않으면 호스트 바깥에서는 컨테이너 포트에 접근할 수 없습니다. Dockerfile의 EXPOSE는 포트를 실제로 열지 않고, 이 이미지가 어떤 포트를 쓰는지 알려 주는 문서 역할이라서 외부에서 접속하려면 `docker run -p` 가 따로 필요합니다. `-P` 를 쓰면 EXPOSE된 포트를 호스트의 임의 높은 포트에 매핑합니다. `-p` 만 쓰면 외부에도 열리므로 호스트에서만 쓰려면 `127.0.0.1:8080:80` 처럼 주소를 붙입니다.

```bash
docker run -d --name web -p 127.0.0.1:18080:80 nginx:1.27-alpine
curl http://127.0.0.1:18080
```

(공식 문서) Port publishing 페이지는 `-p` 또는 `--publish` 로 컨테이너 포트를 호스트에 발행하고, 발행한 포트는 Docker 호스트뿐 아니라 외부에도 열리므로 안전하지 않은 기본값이며, 호스트 IP에 `127.0.0.1` 을 주면 호스트에서만 접근된다고 한다(Docker Engine 28.0.0 미만에서는 같은 L2 구간의 다른 호스트가 localhost 에 발행된 포트에 닿을 수 있었다는 경고가 같은 페이지에 있다). Engine network 페이지는 발행하지 않은 브리지 네트워크의 컨테이너 포트가 Docker 호스트와 같은 네트워크의 컨테이너에서만 접근되고 호스트 바깥에서는 접근되지 않는다고 설명한다. Dockerfile 레퍼런스는 EXPOSE가 포트를 실제로 발행하지 않으며 이미지 작성자와 실행하는 사람 사이의 문서 역할이고, `docker run -p` 로 발행하며 `-P` 는 노출된 모든 포트를 높은 번호의 임의 포트에 매핑한다고 한다.
(실험 확인) Docker Engine 29.6.1(macOS)에서 nginx:1.27-alpine을 `-p 127.0.0.1:18080:80` 로 띄우면 `curl` 이 응답했고 `docker port` 는 `80/tcp -> 127.0.0.1:18080` 을 보였다. `-p` 없이 띄웠을 때는 호스트의 80번과 18080번 모두 `curl` 이 연결하지 못했다(응답 코드 000). 이미지 설정의 `ExposedPorts` 는 `{"80/tcp":{}}` 였고, `-P` 로 띄우면 `80/tcp -> 0.0.0.0:55000` 처럼 임의 포트가 배정됐다. 다른 PC에서 접속해 보는 외부 접근 실험은 하지 않았다.
