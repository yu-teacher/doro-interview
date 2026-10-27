---
slug: "ctn-19"
topic: "dev-container"
tier: DEEP
difficulty: 2
title: "컨테이너에 Docker 소켓(`/var/run/docker.sock`)을 마운트하거나 `--privileged`를 주면 왜 위험한가요?"
keywords: ["docker.sock은 데몬 제어 API", "컨테이너 생성·조작 가능하면 호스트 장악 수준", "--privileged는 모든 capability와 장치", "기본 보호 장치 완화", "필요한 권한만 cap-add·device"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.docker.com/reference/cli/docker/container/run/", "https://docs.docker.com/engine/containers/run/", "https://docs.docker.com/engine/security/"]
concepts: [container-hardening]
importance: 2
links: [{to: "ctn-17", kind: PREREQ}, {to: "k8c-06", kind: RELATED}]
---
**모범 답변 (30~60초)**
Docker 소켓은 데몬을 제어하는 API의 입구라서 컨테이너에 마운트하면 그 컨테이너가 호스트의 다른 컨테이너를 만들고 조작할 수 있고, 공식 문서도 호스트 데몬에 대한 완전한 접근을 준다고 설명합니다. `--privileged` 는 모든 capability와 호스트의 모든 장치 접근을 주고 AppArmor나 SELinux 제한도 풀어 호스트 프로세스와 거의 같은 접근을 줍니다. 그래서 둘 다 신뢰할 수 없는 코드가 도는 컨테이너에는 쓰면 안 되고, 꼭 필요하면 `--cap-add` 나 `--device` 로 필요한 권한만 좁혀서 줍니다.

```bash
docker run --rm --user 0 -v /var/run/docker.sock:/var/run/docker.sock curlimages/curl:latest \
  -s --unix-socket /var/run/docker.sock http://localhost/version
docker run --rm --privileged busybox:1.36 sh -c 'grep CapEff /proc/self/status; ls /dev | wc -l'
```

(공식 문서) `docker run` 문서는 Docker 유닉스 소켓과 Docker 바이너리를 컨테이너에 바인드 마운트하면 컨테이너가 호스트 Docker 데몬을 만들고 조작할 수 있는 전체 권한을 얻는다고 설명한다. 실행 문서는 기본 컨테이너가 장치에 접근할 수 없지만 `--privileged` 는 모든 capability를 주고 호스트의 모든 장치에 접근하게 하며 AppArmor나 SELinux를 호스트의 프로세스와 거의 같은 접근을 허용하도록 다시 설정하므로 주의해서 쓰라고 하고, 특정 장치만은 `--device` 로 열라고 한다. Docker security 페이지는 신뢰할 수 있는 사용자만 데몬을 제어하게 해야 한다고 하면서, Docker가 호스트 디렉터리를 컨테이너와 접근 권한 제한 없이 공유할 수 있어 `/host` 가 호스트의 `/` 인 컨테이너를 시작해 호스트 파일시스템을 마음대로 바꿀 수 있다고 설명한다.
(실험 확인) Docker Engine 29.6.1에서 `curlimages/curl` 컨테이너(`--user 0`)에 소켓을 마운트하고 `GET /version` 을 보내자 호스트 데몬의 정보(Version 29.6.1, ApiVersion 1.55, KernelVersion 6.12.76-linuxkit)가 응답됐다(2026-10-27 재실행). 소켓을 마운트하지 않은 컨테이너의 같은 요청은 curl 종료 코드 7(연결 실패)이었다. 이 이미지의 기본 사용자(uid 100)로는 응답이 비어 있어서 `--user 0` 으로 바꿨다. 같은 소켓으로 `POST /containers/create`(`Binds: ["/:/host:ro"]`)와 `/start` 를 보내자 새 컨테이너가 만들어져 Docker Desktop VM의 `/etc/hostname`(`debuerreotype`)과 `/` 의 목록을 읽었고, 그 컨테이너는 API로 지웠다(읽기 전용 마운트로만 시험했다). `--privileged` 컨테이너의 `CapEff` 는 `000001ffffffffff`(기본은 `00000000a80425fb`), `/dev` 항목 수는 167개(기본은 15개), `Seccomp` 는 0(기본은 2)이었고 `mount -t tmpfs` 가 성공했다(기본 컨테이너는 `permission denied`). `--cap-drop ALL --cap-add SYS_ADMIN` 만으로도 같은 mount가 성공했고, `--device=/dev/null:/dev/mynull` 은 장치 하나만 열어 줬다.
