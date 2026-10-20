---
slug: "cic-12"
topic: "dev-cicd"
tier: DEEP
difficulty: 2
title: "같은 브랜치에 푸시가 연달아 오거나 배포가 겹치지 않게 하려면 concurrency를 어떻게 쓰나요?"
keywords: ["concurrency group", "그룹당 하나만 실행", "cancel-in-progress", "대기 중 실행은 새것으로 교체", "environment와는 별개"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency", "https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/control-deployments"]
concepts: [ci-pipeline]
importance: 1
links: [{to: "cic-03", kind: PREREQ}]
---
**모범 답변 (30~60초)**
`concurrency.group`에 문자열이나 표현식을 주면 같은 그룹에서는 한 번에 하나의 workflow나 job만 실행됩니다. 이미 실행 중인데 새 실행이 들어오면 새 실행은 대기(pending)하고, 기존에 대기하던 실행은 기본적으로 취소되어 새것으로 대체됩니다. `cancel-in-progress: true`를 주면 실행 중인 것까지 취소합니다. 그래서 CI는 workflow 이름과 ref를 합친 그룹을 쓰되 PR 실행에만 취소를 켜서 오래된 커밋의 빌드를 버리고, 운영 배포는 `production` 같은 고정 그룹을 쓰되 배포가 도중에 끊기지 않도록 취소를 켜지 않는 편이 안전합니다. concurrency와 environment는 서로 연결되어 있지 않으므로 필요한 곳에 각각 지정해야 합니다.

```yaml
on:
  push:
    branches: [main]
  pull_request:
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: echo test
  deploy:
    needs: test
    runs-on: ubuntu-latest
    concurrency: production
    steps:
      - run: echo deploy
```

(공식 문서) Control the concurrency 문서는 같은 concurrency 그룹에서는 최대 하나의 실행 중인 job이나 workflow만 있고, 이미 실행 중일 때 새 실행이 큐에 들어오면 pending이 되며 같은 그룹에서 기다리던 pending 실행은 기본적으로 취소되어 새 실행으로 대체된다고 한다. `cancel-in-progress: true`는 실행 중인 것도 취소하며 표현식으로 조건부 취소도 할 수 있다. 같은 문서는 `queue: max`로 대기 실행을 최대 100개까지 쌓을 수도 있다고 하며 `cancel-in-progress: true`와는 함께 못 쓴다고 한다. 그룹 이름은 대소문자를 구분하지 않으며, `github.head_ref`는 `pull_request`에서만 정의되므로 `github.head_ref || github.run_id`처럼 대체값이 필요하고, 여러 workflow가 같은 그룹 이름을 쓰면 서로를 취소할 수 있으니 `github.workflow`를 넣으라고 한다. Deploying with GitHub Actions 문서는 concurrency와 environment가 연결되어 있지 않아서 같은 environment를 쓰는 다른 workflow가 concurrency를 지정하지 않으면 제어를 받지 않는다고 한다(2026-10-20 원문 확인).
(실험 확인) 위 YAML은 actionlint 1.7.12로 문법 검사를 통과했다. 취소와 대기 동작은 GitHub 서버가 필요해 실험하지 않았다.
(보충) 운영 배포 그룹에서 취소를 켜지 않는 편이 안전하다는 판단과 PR 실행에만 취소를 켜는 구성은 일반적인 실무 조언이다. 문서의 deployment 예제에는 `cancel-in-progress: true`를 쓴 경우도 함께 나온다.
