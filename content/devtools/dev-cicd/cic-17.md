---
slug: "cic-17"
topic: "dev-cicd"
tier: TRICKY
difficulty: 3
title: "`pull_request`와 `pull_request_target`은 무엇이 다르고, 포크에서 온 PR에 `pull_request_target`을 쓸 때 왜 위험한가요?"
keywords: ["기본 브랜치 컨텍스트에서 실행", "포크 PR에는 시크릿 미전달", "신뢰할 수 없는 PR 코드 체크아웃 금지", "쓰기 권한 토큰", "저장소 탈취 위험"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows", "https://docs.github.com/en/actions/reference/security/secure-use", "https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax", "https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets", "https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching"]
---
**모범 답변 (30~60초)**
`pull_request`는 PR을 베이스에 합친 병합 결과를 체크아웃해 PR 쪽 코드로 실행되고, 포크에서 온 PR에서는 `GITHUB_TOKEN`을 제외한 시크릿이 전달되지 않습니다. 반대로 `pull_request_target`은 베이스 저장소의 기본 브랜치 컨텍스트에서 실행되어, PR 헤드의 안전하지 않은 코드가 실행되지 않으므로 포크 PR에 라벨이나 댓글을 다는 용도에 적합합니다. 하지만 이 트리거는 저장소 쓰기 권한이 있는 토큰과 시크릿에 접근할 수 있어서, 여기서 PR의 코드를 체크아웃해 빌드하거나 실행하면 공격자의 코드가 그 권한으로 돌아 저장소 탈취로 이어질 수 있습니다. 그래서 `pull_request_target`에서는 신뢰할 수 없는 PR 코드를 체크아웃하거나 실행하지 말고, 꼭 필요한 경우가 아니면 이 트리거를 쓰지 않습니다.

```yaml
on: pull_request_target
permissions:
  pull-requests: write
jobs:
  label:
    runs-on: ubuntu-latest
    steps:
      - run: echo "라벨만 단다. PR 코드는 체크아웃하지 않는다"
```

(공식 문서) Events that trigger workflows 문서는 `pull_request_target`이 PR의 병합 커밋이 아니라 베이스 저장소 기본 브랜치의 컨텍스트에서 실행되어 PR 헤드의 안전하지 않은 코드가 저장소를 바꾸거나 시크릿을 훔치는 것을 막으며, 포크 PR에 라벨이나 댓글을 다는 작업이 가능하다고 한다. 또 PR의 코드를 빌드하거나 실행해야 하면 이 이벤트를 피하라고 하고, 신뢰할 수 없는 코드를 실행하면 캐시 오염과 의도하지 않은 쓰기 권한·시크릿 접근 문제가 생길 수 있다고 경고한다. workflow 문법 문서는 `pull_request_target`에서는 공개 포크에서 시작해도 `GITHUB_TOKEN`에 읽기·쓰기 권한이 부여된다고 한다. Using secrets 문서는 포크에서 시작된 workflow에는 `GITHUB_TOKEN`을 제외한 시크릿이 러너에 전달되지 않는다고 한다. Secure use reference 문서는 `pull_request_target`이나 `workflow_run`과 신뢰할 수 없는 PR 체크아웃을 함께 쓰면 저장소 탈취로 이어질 수 있다고 하고, 꼭 필요한 경우가 아니면 쓰지 말며 이 트리거에서 PR 코드를 명시적으로 체크아웃하지 말라고 한다. Dependency caching reference 문서는 `pull_request_target` 같은 낮은 신뢰의 트리거에는 기본 브랜치 범위의 캐시에 읽기 전용 접근만 준다고 한다(2026-10-20 원문 확인).
(실험 확인) 위 YAML은 actionlint 1.7.12로 문법 검사를 통과했다. 권한과 시크릿 전달 방식은 GitHub 서버가 필요해 실험하지 않았다.
