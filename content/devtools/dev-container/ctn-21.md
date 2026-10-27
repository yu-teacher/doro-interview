---
slug: "ctn-21"
topic: "dev-container"
tier: TRICKY
difficulty: 3
title: "Docker와 쿠버네티스는 seccomp 기본 프로파일을 똑같이 적용하나요? Pod에서 컨테이너를 하드닝하려면 어떤 설정을 해야 하나요?"
keywords: ["Docker는 기본 seccomp 프로파일 적용", "Pod는 기본 Unconfined", "seccompProfile RuntimeDefault", "allowPrivilegeEscalation false로 새 권한 차단", "capabilities drop ALL과 runAsNonRoot"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.docker.com/engine/security/seccomp/", "https://kubernetes.io/docs/tutorials/security/seccomp/", "https://kubernetes.io/docs/tasks/configure-pod-container/security-context/", "https://kubernetes.io/docs/concepts/security/pod-security-standards/", "https://kubernetes.io/docs/concepts/security/application-security-checklist/"]
concepts: [container-hardening]
importance: 1
links: [{to: "ctn-16", kind: PREREQ}, {to: "ctn-17", kind: PREREQ}, {to: "k8c-07", kind: RELATED}]
---
**모범 답변 (30~60초)**
다릅니다. Docker는 컨테이너에 기본 seccomp 프로파일을 적용하지만, 쿠버네티스 Pod는 kubelet의 seccompDefault 옵션을 켜지 않았다면 프로파일을 지정하지 않을 때 Unconfined로 실행됩니다. 그래서 Pod의 securityContext에 `seccompProfile.type: RuntimeDefault` 를 명시하는 것이 안전합니다. 같은 맥락에서 `runAsNonRoot` 로 비루트 실행, `readOnlyRootFilesystem: true` 로 읽기 전용 루트, `allowPrivilegeEscalation: false` 로 새 권한 획득 차단(`no_new_privs`), `capabilities.drop: [ALL]` 로 권한 제거를 함께 설정합니다.

```yaml
spec:
  securityContext:
    seccompProfile: {type: RuntimeDefault}
  containers:
  - name: c
    securityContext:
      runAsUser: 1000
      runAsNonRoot: true
      readOnlyRootFilesystem: true
      allowPrivilegeEscalation: false
      capabilities: {drop: ["ALL"]}
```

(공식 문서) Docker의 seccomp 문서는 기본 프로파일이 허용 목록 방식으로 300여 개 중 약 44개의 시스템 콜을 막는다고 한다. Kubernetes seccomp 튜토리얼은 `seccompDefault` 설정이 켜져 있으면(kubelet의 `--seccomp-default`, v1.27부터 stable) 프로파일을 지정하지 않은 Pod가 `RuntimeDefault` 를 쓰고, 그렇지 않으면 기본은 `Unconfined` 라고 하며, `RuntimeDefault` 는 컨테이너 런타임의 기본 프로파일을 쓰게 하는 설정이라고 한다. Security context 문서는 `allowPrivilegeEscalation` 이 컨테이너 프로세스의 `no_new_privs` 플래그를 직접 제어하고(값이 반대), 지정하지 않으면 기본이 true이며, `readOnlyRootFilesystem` 은 루트 파일시스템을 읽기 전용으로 마운트한다고 한다. 애플리케이션 보안 체크리스트는 `allowPrivilegeEscalation: false`, `readOnlyRootFilesystem: true`, privileged 금지, 모든 capability drop 후 필요한 것만 추가를 컨테이너 수준 권장 설정으로 든다. Pod Security Standards의 restricted 수준은 비루트 실행(`runAsNonRoot: true`, `runAsUser` 0 금지), `allowPrivilegeEscalation: false`, 모든 capability drop, seccomp 프로파일 명시(Unconfined나 프로파일 없음은 금지)를 요구한다.
(실험 확인) Kubernetes v1.36.1(Docker Desktop, Docker Engine 29.6.1)에서 securityContext 없는 Pod의 `/proc/self/status` 는 `Seccomp: 0`(필터 없음)이었고, `seccompProfile: RuntimeDefault` Pod는 `Seccomp: 2`, `Seccomp_filters: 1`(필터 적용)이었다(2026-10-27 재실행). 같은 환경에서 `docker run` 의 기본 컨테이너도 `Seccomp: 2` 였고 `--security-opt seccomp=unconfined` 를 주면 0이었다. 하드닝 설정(`runAsUser: 1000`, `runAsNonRoot`, `readOnlyRootFilesystem`, `allowPrivilegeEscalation: false`, `capabilities.drop: [ALL]`, Pod 수준 `seccompProfile: RuntimeDefault`) Pod는 `uid=1000 gid=0(root)`, `CapEff` 0, `NoNewPrivs: 1`, `Seccomp: 2`, `touch /x` 는 `Read-only file system` 이었다. `capabilities.drop: [ALL]` 만 준 Pod는 `CapEff` 0이지만 `Seccomp: 0`, `NoNewPrivs: 0` 이었다. 즉 seccomp는 따로 지정해야 적용된다. `runAsGroup` 을 주지 않아 gid는 0으로 남았다. 반례로 `runAsNonRoot: true` 만 주고 `runAsUser` 를 주지 않은 root 이미지(busybox) Pod는 `container has runAsNonRoot and image will run as root` 로 `CreateContainerConfigError` 였다. 전용 네임스페이스에 `pod-security.kubernetes.io/enforce=restricted` 를 걸면 `readOnlyRootFilesystem` 없이 `runAsUser: 1000`, `runAsNonRoot`, `allowPrivilegeEscalation: false`, drop ALL, `RuntimeDefault` 만 가진 Pod는 통과해 실행됐고, 설정 없는 Pod는 `allowPrivilegeEscalation`·capabilities·`runAsNonRoot`·seccomp 위반으로 거부됐다.
