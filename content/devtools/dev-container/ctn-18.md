---
slug: "ctn-18"
topic: "dev-container"
tier: DEEP
difficulty: 3
title: "컨테이너 안의 root(uid 0)는 호스트의 root와 같은 사용자인가요? 사용자 네임스페이스 리맵과 rootless 모드는 무엇을 바꾸나요?"
keywords: ["기본은 사용자 네임스페이스 미사용", "컨테이너 uid 0은 호스트 uid 0과 같은 번호", "userns-remap은 호스트의 높은 번호 UID로 매핑", "rootless는 데몬과 컨테이너 모두 비root", "제약과 설정 복잡도"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.docker.com/engine/security/userns-remap/", "https://docs.docker.com/engine/security/rootless/", "https://docs.docker.com/engine/security/", "https://raw.githubusercontent.com/opencontainers/runtime-spec/main/config-linux.md"]
concepts: [container-hardening, container-isolation]
importance: 2
links: [{to: "ctn-17", kind: PREREQ}, {to: "dkr-17", kind: RELATED}]
---
**모범 답변 (30~60초)**
Docker의 기본 설정에서는 컨테이너가 호스트와 같은 사용자 네임스페이스를 쓰기 때문에 컨테이너 안 uid 0은 호스트의 uid 0과 같은 번호의 사용자입니다. 다만 capability가 제한되고 다른 방어 장치도 있어서 호스트의 진짜 root만큼 강하지는 않습니다. 사용자 네임스페이스 리맵을 켜면 컨테이너의 root를 호스트의 권한 없는 높은 번호 UID로 매핑해, 탈출하더라도 호스트에서 권한이 없게 만듭니다. rootless 모드는 한 걸음 더 나아가 데몬과 컨테이너를 모두 비root 사용자로 실행합니다.

```bash
docker run --rm busybox:1.36 cat /proc/self/uid_map    # 0 0 4294967295 : 항등 매핑
```

(공식 문서) Docker의 userns-remap 문서는 컨테이너 안의 앱을 권한 없는 사용자로 실행하는 것이 권한 상승 공격을 막는 가장 좋은 방법이고, root로 돌아야 하는 컨테이너는 그 root를 호스트의 덜 특권적인 사용자로 재매핑할 수 있다고 한다. 매핑된 UID 범위는 컨테이너 안에서는 0부터 65536의 일반 UID처럼 동작하지만 호스트에서는 권한이 없다. 매핑은 `/etc/subuid`, `/etc/subgid` 로 정하고 userns-remap에서도 Docker 데몬은 여전히 root로 돌며, 호스트의 자원이 필요한 bind mount 같은 상황은 설정이 복잡해진다고 한다. Rootless 문서는 데몬과 컨테이너를 사용자 네임스페이스 안에서 비root로 실행해 데몬과 런타임의 잠재적 취약점을 완화한다고 한다. OCI 런타임 사양의 user 네임스페이스는 `uidMappings`·`gidMappings` 로 호스트와 컨테이너 사이의 사용자 ID를 재매핑한다. Docker security 페이지는 컨테이너 안의 root가 진짜 root보다 권한이 훨씬 적다고 한다.
(실험 확인) Docker Engine 29.6.1(Docker Desktop VM)에서 기본 컨테이너의 `/proc/self/uid_map`·`gid_map` 은 `0 0 4294967295`(컨테이너 uid 0이 바깥 uid 0, 항등 매핑)였고(2026-10-27 재실행), user 네임스페이스는 `--pid=host` 로 띄운 컨테이너와 같은 `user:[4026531837]` 이었다. `docker info` 의 보안 옵션은 `seccomp`, `cgroupns` 뿐이고 userns 항목은 없었다. VM 쪽에서 본 컨테이너 프로세스의 `Uid` 는 `0 0 0 0` 이었고, VM 경로를 bind mount한 컨테이너의 root가 만든 파일은 소유자가 uid 0이었다. `--user 1000:1000` 컨테이너도 `uid_map` 은 항등 매핑이었다. 컨테이너 안에서 `unshare -U` 로 새 사용자 네임스페이스를 만들려 하면 `Operation not permitted` 였다(기본 seccomp 프로파일 때문으로 보이나 원인은 확인하지 않았다). userns-remap이나 rootless 모드는 데몬 설정이 필요해 실행해 보지 않았다(문서 근거만 있다).
