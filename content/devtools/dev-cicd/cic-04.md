---
slug: "cic-04"
topic: "dev-cicd"
tier: BASIC
difficulty: 2
title: "`push`, `pull_request`, `workflow_dispatch`, `schedule` 트리거는 각각 언제 실행되고 어떤 점을 주의해야 하나요?"
keywords: ["push는 커밋·태그 푸시", "pull_request는 병합 결과 기준", "workflow_dispatch 수동 실행", "schedule은 기본 브랜치와 UTC", "branches·paths 필터"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows", "https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax"]
concepts: [ci-pipeline]
importance: 2
links: [{to: "cic-17", kind: FOLLOWUP}, {to: "cic-03", kind: PREREQ}]
---
**모범 답변 (30~60초)**
`push`는 브랜치나 태그에 커밋을 푸시할 때, `pull_request`는 PR을 열거나 갱신하거나 다시 열 때가 기본값이고, `workflow_dispatch`는 화면·API·CLI로 수동 실행할 때, `schedule`은 cron 식으로 주기 실행할 때 동작합니다. `pull_request`는 기본적으로 PR 브랜치를 베이스에 합친 병합 결과를 체크아웃해서 테스트하고, 병합 충돌이 있으면 실행되지 않습니다. `schedule`은 기본 브랜치의 최신 커밋에서만 돌고 기본 시간대는 UTC이며(IANA 시간대 지정도 가능), 부하가 몰리는 매시 정각 무렵에는 지연되거나 일부가 버려질 수 있습니다. `workflow_dispatch`도 워크플로 파일이 기본 브랜치에 있어야 실행 버튼이 나타납니다. `branches`와 `paths` 필터를 같이 쓰면 둘 다 만족해야 실행됩니다.

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:
  schedule:
    - cron: '17 3 * * 1-5'
```

(공식 문서) Events that trigger workflows 문서는 `pull_request`가 기본으로 `opened`, `synchronize`, `reopened` 활동에서만 실행되고 `types`로 바꿀 수 있으며, 병합 충돌이 있는 PR에서는 실행되지 않는다고 한다. 이때 `GITHUB_REF`는 병합 브랜치(`refs/pull/번호/merge`)이고 `actions/checkout`이 그것을 체크아웃하므로 병합 결과를 테스트하며, PR 헤드 커밋을 쓰려면 `github.event.pull_request.head.sha`를 쓰라고 한다. `schedule`은 기본 브랜치의 최신 커밋에서만 실행되고 최단 간격은 5분이며, 기본은 UTC이고 IANA 시간대 문자열로 `timezone`을 지정할 수도 있다. 부하가 큰 시간대(매시 정각 포함)에는 지연되거나 대기 중인 job 일부가 버려질 수 있고, 공개 저장소는 60일간 활동이 없으면 자동으로 비활성화된다. `workflow_dispatch`는 파일이 기본 브랜치에 있어야 화면의 실행 버튼이 나타나고, 한 번 실행된 뒤에는 API나 CLI로 다른 브랜치·태그를 지정해 실행할 수 있다고 한다. workflow 문법 문서도 `schedule`의 기본 UTC와 `timezone` 지정을 설명한다. `branches`와 `paths`를 함께 쓰면 두 필터를 모두 만족해야 한다고 한다(2026-10-20 원문 확인).
(실험 확인) 위 YAML은 트리거만 적은 조각이라 단독으로는 actionlint 1.7.12가 `jobs` 섹션이 없다는 오류를 내고, 아무 job을 붙인 형태로는 문법 검사를 통과했다(로컬 Docker 이미지로 실행). 트리거가 실제로 동작하는 방식은 GitHub 서버가 필요해 실험하지 않았다.
