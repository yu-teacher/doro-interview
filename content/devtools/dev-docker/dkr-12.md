---
slug: "dkr-12"
topic: "dev-docker"
tier: DEEP
difficulty: 2
title: "Docker Compose는 무엇이고, 여러 컨테이너를 어떻게 구성하고 서로 통신하게 하나요?"
keywords: ["compose.yaml 하나로 정의", "docker compose up", "서비스 이름 DNS", "프로젝트 기본 네트워크", "호스트 포트는 외부 접속용"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.docker.com/get-started/docker-concepts/running-containers/multi-container-applications/", "https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-docker-compose/", "https://docs.docker.com/compose/how-tos/networking/", "https://docs.docker.com/compose/intro/features-uses/", "https://docs.docker.com/compose/intro/compose-application-model/"]
---
**모범 답변 (30~60초)**
Docker Compose는 여러 컨테이너로 이루어진 앱의 서비스, 네트워크, 볼륨, 환경 변수를 `compose.yaml` 하나에 정의해 두고 `docker compose up` 한 번으로 띄우는 도구입니다. 서비스마다 `docker run` 을 길게 치면서 실행 순서와 네트워크를 손으로 관리하는 번거로움이 사라지고, 개발이나 테스트 환경을 같은 파일로 재현할 수 있습니다. Compose는 프로젝트마다 기본 네트워크를 하나 만들어 모든 서비스를 붙이고, 서비스끼리는 서비스 이름으로 통신합니다. `ports` 의 호스트 포트는 호스트에서 접속할 때만 쓰고 서비스 간 통신에는 컨테이너 포트를 씁니다.

```yaml
name: exp-docker-compose
services:
  db:
    image: busybox:1.36
    command: sleep 300
  app:
    image: busybox:1.36
    command: sh -c "nslookup db; sleep 300"
```

(공식 문서) Multi-container applications 페이지는 `docker run` 으로 여러 컨테이너를 관리하면 설정·순서·네트워크 관리가 어렵다고 하고, Compose가 전체 앱을 `compose.yml` 하나에 정의해 서비스와 의존성·환경 변수·볼륨·네트워크를 중앙에서 관리하게 해 준다고 한다. Compose networking 페이지는 `docker compose up` 시 `<프로젝트명>_default` 라는 bridge 네트워크가 만들어지고 각 서비스가 서비스 이름으로 등록되어 이름으로 서로를 찾으며, 서비스 간 통신에는 컨테이너 포트를 쓰고 호스트 포트는 외부에서 접근할 때만 쓰인다고 한다. Compose application model 페이지는 Compose 파일의 기본 경로가 `compose.yaml`(권장) 또는 `compose.yml` 이라고 한다. Features and uses 페이지는 Compose의 용도로 개발 환경, 자동화된 테스트 환경(`up`, 테스트, `down`), 단일 호스트 배포를 든다.
(실험 확인) Docker Engine 29.6.1, Compose v5.3.0에서 위와 같은 구조(프로젝트명 `exp-docker-compose`, 로컬에 있는 busybox:1.36만 사용)로 `docker compose up -d` 를 실행하자 `exp-docker-compose_default` 라는 bridge 네트워크가 생겼고, 앱 컨테이너에서 `nslookup db` 가 DB 서비스의 컨테이너 IP(`172.21.0.2`)를 반환했다. `docker compose down` 으로 컨테이너와 네트워크가 함께 삭제됐다. 실험에는 로컬에 있던 busybox:1.36 서비스만 썼다(`docker pull` 없이 `pull_policy: never`).
