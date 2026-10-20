---
slug: "dkr-11"
topic: "dev-docker"
tier: DEEP
difficulty: 2
title: "같은 호스트의 컨테이너끼리 이름으로 통신하려면 어떤 네트워크를 써야 하나요?"
keywords: ["기본 bridge는 이름 해석 불가", "사용자 정의 bridge는 자동 DNS", "컨테이너 이름·별칭으로 접속", "docker network create", "네트워크 단위 격리"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.docker.com/engine/network/", "https://docs.docker.com/engine/network/drivers/bridge/", "https://docs.docker.com/compose/how-tos/networking/"]
---
**모범 답변 (30~60초)**
`--network` 없이 띄운 컨테이너는 기본 bridge 네트워크에 붙는데, 여기서는 컨테이너끼리 IP 주소로만 통신할 수 있고 이름으로는 찾지 못합니다. `docker network create` 로 만든 사용자 정의 bridge 네트워크에 붙이면 Docker가 컨테이너 이름이나 별칭을 IP로 풀어 주는 DNS를 제공합니다. 그래서 웹 컨테이너가 DB에 `db:5432` 처럼 이름으로 접속할 수 있고, IP는 컨테이너가 다시 만들어질 때 바뀔 수 있으므로 이름을 쓰는 게 맞습니다. 사용자 정의 네트워크는 같은 네트워크의 컨테이너끼리만 통신해서 격리도 더 낫습니다.

```bash
docker network create exp-net
docker run -d --name web --network exp-net nginx:1.27-alpine
docker run --rm --network exp-net busybox:1.36 wget -q -O- http://web
```

(공식 문서) Container networking 페이지는 기본 bridge에 붙은 컨테이너는 컨테이너 IP로 서로 접근하지만 이름으로는 지칭하지 못하고, 사용자 정의 네트워크에 연결하면 IP나 컨테이너 이름으로 통신할 수 있다고 한다. Bridge network driver 페이지는 사용자 정의 bridge가 컨테이너 사이 자동 DNS 해석을 제공하고(기본 bridge는 레거시 `--link` 가 필요), 더 나은 격리를 제공하며 즉석으로 연결·해제할 수 있다고 한다. Compose 네트워킹 페이지는 컨테이너 IP가 시작할 때마다 동적으로 배정되어 유지되지 않으므로 IP가 아니라 서비스 이름으로 참조하라고 한다.
(실험 확인) Docker Engine 29.6.1에서 기본 bridge에 띄운 nginx:1.27-alpine 컨테이너를 같은 기본 bridge의 busybox:1.36에서 이름으로 `wget` 하자 `bad address` 로 실패했다. 사용자 정의 네트워크(`docker network create`)에서는 같은 요청이 nginx 환영 페이지의 `<title>` 을 반환했고 `nslookup` 이 컨테이너 이름을 `172.21.0.2` 로 풀었다. 기본 bridge에서 컨테이너 IP로 접속하면(재실행에서 확인) 같은 응답을 받았다.
