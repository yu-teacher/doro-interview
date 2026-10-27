---
slug: "ctn-17"
topic: "dev-container"
tier: DEEP
difficulty: 2
title: "리눅스 capability는 무엇이고, root로 실행되는 컨테이너에 `--cap-drop ALL`을 주면 무엇이 막히나요?"
keywords: ["root 권한을 잘게 나눈 capability", "Docker 기본은 허용 목록 방식", "필요한 것만 남기는 --cap-drop ALL --cap-add", "root여도 chown 같은 작업 불가", "컨테이너 root는 호스트 root보다 약함"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.docker.com/engine/security/", "https://docs.docker.com/engine/containers/run/", "https://raw.githubusercontent.com/opencontainers/runtime-spec/main/config.md", "https://kubernetes.io/docs/tasks/configure-pod-container/security-context/"]
concepts: [container-hardening]
importance: 2
links: [{to: "ctn-18", kind: FOLLOWUP}, {to: "k8c-07", kind: RELATED}]
---
**모범 답변 (30~60초)**
capability는 root의 전능한 권한을 파일 소유자 변경, 1024 미만 포트 바인딩, mount, raw 소켓 같은 단위로 쪼갠 권한입니다. Docker는 컨테이너를 최소한의 capability만 남기는 허용 목록 방식으로 시작하기 때문에 컨테이너 안 root도 호스트의 진짜 root보다 권한이 적고, 모범 사례는 필요한 것만 남기고 전부 빼는 것입니다. `--cap-drop ALL` 을 주면 uid 0이어도 `chown` 같은 특권 작업이 `Operation not permitted` 로 막히고, 꼭 필요한 권한만 `--cap-add` 로 되돌립니다.

```bash
docker run --rm busybox:1.36 sh -c 'grep CapEff /proc/self/status; touch /x; chown 1000 /x && echo chown-ok'
docker run --rm --cap-drop ALL busybox:1.36 sh -c 'grep CapEff /proc/self/status; touch /x; chown 1000 /x'
```

(공식 문서) Docker security 페이지는 capability가 root/non-root의 이분법을 세분화한 접근 제어이고, 1024 미만 포트만 필요한 서버는 root 대신 `net_bind_service` capability만 받으면 된다고 설명한다. Docker는 기본적으로 필요한 것만 남기는 허용 목록 방식으로 capability를 제한하므로 컨테이너의 root는 mount 거부, raw 소켓 접근 거부, 장치 노드 생성·소유자 변경 거부, 모듈 로딩 거부 등으로 진짜 root보다 권한이 적고, 모범 사례는 필요한 것을 뺀 나머지를 모두 제거하는 것이라고 한다. `docker run` 문서는 `--cap-add`·`--cap-drop` 으로 조정하며 기본 유지 목록에 `CHOWN`, `DAC_OVERRIDE`, `FOWNER`, `FSETID`, `KILL`, `SETGID`, `SETUID`, `SETPCAP`, `NET_BIND_SERVICE`, `NET_RAW`, `SYS_CHROOT`, `MKNOD`, `AUDIT_WRITE`, `SETFCAP` 14개가 있다고 표로 보여 준다. OCI 런타임 설정은 프로세스의 `capabilities` 를 effective·bounding 등으로 지정한다.
(실험 확인) Docker Engine 29.6.1(busybox:1.36, Docker Desktop VM)에서 기본 컨테이너의 `CapEff` 는 `00000000a80425fb` 였고 이 값의 켜진 비트는 14개(0, 1, 3, 4, 5, 6, 7, 8, 10, 13, 18, 27, 29, 31)로 위 14개와 같은 번호였다(2026-10-27 재실행). `--cap-drop ALL` 컨테이너는 `CapEff` 가 0이었고, uid 0인데도 `touch /x` 는 성공(루트 디렉터리 소유자가 root이기 때문)하지만 `chown 1000 /x`, `mknod`, 일반 `ping`(raw 소켓)은 `Operation not permitted`·`permission denied` 였다(기본 컨테이너에서는 chown·mknod·ping이 성공하고 `mount` 는 `permission denied`). `--cap-drop ALL --cap-add CHOWN` 은 `CapEff` 가 `…01` 이고 `chown` 이 성공했다. 흥미롭게도 `--cap-drop ALL` 이나 `--user 1000:1000` 컨테이너에서도 `nc -l -p 80` 이 오류 없이 대기했고 컨테이너 안 `net.ipv4.ip_unprivileged_port_start` 값은 0이었다. 즉 이 환경의 기본 설정에서는 80번 포트 바인딩에 `NET_BIND_SERVICE` 가 필요하지 않았다. `--sysctl net.ipv4.ip_unprivileged_port_start=1024` 로 바꾸면 root라도 `--cap-drop ALL` 에서는 `bind: Permission denied`, `--cap-drop ALL --cap-add NET_BIND_SERVICE` 에서는 성공했다. Kubernetes v1.36.1에서 `capabilities.drop: [ALL]` Pod의 `CapEff` 도 0이었고 `chown` 이 `Operation not permitted` 였다(대조 Pod는 `CapEff` `00000000a80425fb`, chown 성공).
