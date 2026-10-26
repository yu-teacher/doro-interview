---
slug: "ctn-16"
topic: "dev-container"
tier: DEEP
difficulty: 2
title: "`--read-only`로 컨테이너의 루트 파일시스템을 읽기 전용으로 만들면 무엇이 달라지고, 앱이 써야 하는 경로는 어떻게 처리하나요?"
keywords: ["루트 파일시스템만 읽기 전용", "쓰기 경로는 tmpfs나 볼륨으로 허용", "침입 후 파일 변조 어렵게", "Read-only file system 오류", "쿠버네티스 readOnlyRootFilesystem"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.docker.com/reference/cli/docker/container/run/", "https://raw.githubusercontent.com/opencontainers/runtime-spec/main/config.md", "https://kubernetes.io/docs/tasks/configure-pod-container/security-context/", "https://kubernetes.io/docs/concepts/security/application-security-checklist/"]
concepts: [container-hardening]
importance: 2
links: [{to: "k8c-07", kind: RELATED}, {to: "dkr-17", kind: RELATED}]
---
**모범 답변 (30~60초)**
`--read-only` 는 컨테이너의 루트 파일시스템을 읽기 전용으로 마운트해서, 볼륨 같은 지정한 경로 말고는 쓰기를 막습니다. 침입자가 앱 파일이나 설정을 덮어쓰거나 도구를 심기 어려워지는 하드닝입니다. 대신 앱이 `/tmp`, 캐시, pid 파일 같은 곳에 쓰면 `Read-only file system` 오류로 실패하므로, 쓰기가 필요한 경로는 `--tmpfs /tmp` 나 볼륨으로 따로 열어 줘야 합니다. 쿠버네티스에서는 컨테이너 securityContext의 `readOnlyRootFilesystem: true` 가 같은 설정입니다.

```bash
docker run --rm --read-only busybox:1.36 sh -c 'touch /x; touch /tmp/y'          # 둘 다 Read-only file system
docker run --rm --read-only --tmpfs /tmp busybox:1.36 sh -c 'touch /tmp/y && echo ok; touch /etc/z'
```

```yaml
securityContext:
  readOnlyRootFilesystem: true
```

(공식 문서) `docker run` 문서는 `--read-only` 가 컨테이너의 루트 파일시스템을 읽기 전용으로 마운트해 지정한 볼륨 이외 위치에 쓰는 것을 금지하며, 볼륨과 함께 써서 컨테이너가 어디에 쓸지 통제할 수 있다고 한다. OCI 런타임 사양의 `root.readonly` 는 true면 컨테이너 안에서 root 파일시스템이 읽기 전용이어야 하고 기본값은 false라고 정의한다. Kubernetes security context 문서는 `readOnlyRootFilesystem` 을 컨테이너의 루트 파일시스템을 읽기 전용으로 마운트하는 설정으로 설명하고, 애플리케이션 보안 체크리스트는 컨테이너 수준 권장 설정으로 `readOnlyRootFilesystem: true` 를 `allowPrivilegeEscalation: false`, 모든 capability drop과 함께 든다.
(실험 확인) Docker Engine 29.6.1(busybox:1.36)에서 `--read-only` 컨테이너는 `/x` 와 `/tmp/y` 생성이 모두 `Read-only file system` 으로 실패했고 `/proc/mounts` 의 `/` 는 `overlay ro` 였다(2026-10-27 재실행). `--tmpfs /tmp` 를 더하자 `/tmp/y` 는 성공했고(`tmpfs /tmp tmpfs rw,nosuid,nodev,noexec`) `/etc/z` 는 계속 실패했다. 반례로 `--read-only -v 볼륨:/data` 에서는 `/data` 쓰기와 `/dev/shm`, `/dev` 쓰기가 성공했고 `/etc/hosts` 는 읽기 전용이라 실패했으며, 루트 `mount -o remount,rw /` 는 `permission denied` 였다. Kubernetes v1.36.1에서 `readOnlyRootFilesystem: true` 인 Pod의 `touch /x`, `touch /tmp/y` 는 `Read-only file system` 이었고 `emptyDir` 볼륨을 `/scratch` 에 마운트하자 `touch /scratch/z` 는 성공했다.
(보충) 루트를 읽기 전용으로 두면 침입자가 앱 파일이나 설정을 덮어쓰거나 도구를 심기 어려워진다는 설명은 읽은 문서가 직접 서술한 것이 아니라 `readOnlyRootFilesystem` 이 쓰기를 막는 동작과 체크리스트의 권장에서 이끌어 낸 일반 설명이다.
