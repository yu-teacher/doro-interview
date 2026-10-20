---
slug: "cic-20"
topic: "dev-cicd"
tier: TRICKY
difficulty: 3
title: "워크플로에서 `secrets` 값이 빈 문자열로 나오는 경우는 어떤 때이고, 재사용 워크플로나 `if` 조건에서는 어떻게 다뤄야 하나요?"
keywords: ["미설정 secret은 빈 문자열", "포크 PR에는 전달되지 않음", "재사용 워크플로에 자동 전달 안 됨", "secrets: inherit", "if에서 secrets 직접 참조 불가"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets", "https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows", "https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax", "https://docs.github.com/en/actions/reference/security/secrets"]
concepts: [ci-pipeline]
importance: 1
links: [{to: "cic-06", kind: PREREQ}]
---
**모범 답변 (30~60초)**
설정되지 않은 secret을 참조하면 오류 없이 빈 문자열이 됩니다. 이름의 오타가 흔한 원인이고, 포크에서 시작된 워크플로는 `GITHUB_TOKEN`을 제외한 시크릿을 전달받지 못하며, Dependabot이 일으킨 이벤트에서도 시크릿이 전달되지 않습니다. 재사용 워크플로를 호출할 때도 시크릿이 자동으로 넘어가지 않아서, 호출하는 쪽에서 이름을 지정해 넘기거나 `secrets: inherit`를 써야 합니다. 환경(environment)에 등록한 시크릿을 호출한 쪽이 넘기지 않으면 역시 빈 문자열이 되는데, 재사용 워크플로의 시크릿에 `required: true`를 주면 넘기지 않았을 때 실행이 실패하게 할 수 있습니다. 또 `if:` 조건에서는 `secrets`를 직접 참조할 수 없어서, job의 환경 변수에 담은 뒤 그 변수를 조건에 씁니다.

```yaml
on: push
jobs:
  call:
    uses: ./.github/workflows/called.yml
    secrets: inherit
```

(공식 문서) Using secrets 문서는 secret이 설정되지 않았으면 표현식 값이 빈 문자열이고, `GITHUB_TOKEN`을 제외하면 포크에서 시작된 워크플로에는 secret이 전달되지 않으며 Dependabot 이벤트에서도 쓸 수 없고 재사용 워크플로에도 자동으로 전달되지 않는다고 설명한다. `if:`에서는 secret을 직접 참조할 수 없으니 job 수준 환경 변수로 설정한 뒤 그 변수를 쓰라고 한다. Reuse workflows 문서는 시크릿을 이름으로 넘기거나 같은 조직·엔터프라이즈 안에서는 `secrets: inherit`로 모두 넘길 수 있다고 하고, 환경 secret은 재사용 워크플로 안의 job에 `environment`를 지정해야 쓸 수 있으며 호출한 쪽이 넘기지 않으면 오류 없이 빈 문자열이 된다고 경고하면서 `on.workflow_call.secrets`의 `required: true`로 실행을 실패시킬 수 있다고 한다. 다만 이 설정은 값이 비어 있는지는 검사하지 않는다. Secrets reference 문서는 저장소와 조직 secret은 실행이 큐에 들어갈 때, 환경 secret은 그 환경을 참조하는 job이 시작할 때 읽는다고 한다(2026-10-20 원문 확인).
(실험 확인) 위 호출 워크플로와 호출되는 워크플로는 actionlint 1.7.12로 문법 검사를 통과했다(호출되는 쪽은 `on.workflow_call`과 `secrets.TOKEN` 사용). `if: ${{ secrets.TOKEN != '' }}`로 쓴 워크플로는 `secrets` 컨텍스트가 이 위치에서 허용되지 않는다는 오류가 났다. 시크릿이 실제로 빈 문자열이 되는 동작은 GitHub 서버가 필요해 실험하지 않았다.
