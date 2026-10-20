---
slug: "cic-05"
topic: "dev-cicd"
tier: BASIC
difficulty: 2
title: "GitHub Actions에서 job들은 기본적으로 어떻게 실행되고, `needs`로 순서를 걸면 선행 job이 실패했을 때 어떻게 되나요?"
keywords: ["기본은 병렬 실행", "needs로 선행 job 지정", "선행 job 실패 시 건너뜀", "always()로 계속 실행", "job outputs로 값 전달"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-jobs", "https://docs.github.com/en/actions/get-started/understand-github-actions", "https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax"]
---
**모범 답변 (30~60초)**
기본적으로 job 사이에는 의존성이 없어서 모두 병렬로 실행됩니다. 순서가 필요하면 `needs`에 선행 job을 적고, 그러면 선행 job이 성공해야 그 job이 실행됩니다. 선행 job이 실패하거나 건너뛰어지면 그것을 필요로 하는 job도 건너뛰고, 의존 사슬의 뒤쪽 job도 모두 건너뜁니다. 선행 job의 결과와 관계없이 실행하고 싶으면, 예를 들어 알림이나 정리 작업이라면 `if: ${{ always() }}`를 씁니다. job은 각각 다른 가상 머신에서 돌기 때문에 파일은 공유되지 않고, 값은 job의 `outputs`와 `needs` 컨텍스트로, 파일은 아티팩트로 넘깁니다.

```yaml
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: echo test
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - run: echo deploy
  notify:
    needs: [test, deploy]
    if: ${{ always() }}
    runs-on: ubuntu-latest
    steps:
      - run: echo notify
```

(공식 문서) Using jobs in a workflow 문서는 `jobs.<job_id>.needs`에 적은 job이 성공적으로 끝나야 이 job이 실행되며, 선행 job이 실패하거나 건너뛰어지면 조건식으로 계속하게 하지 않는 한 그것을 필요로 하는 모든 job이 건너뛰어진다고 설명한다. 선행 job이 성공하지 못해도 실행하려면 `jobs.<job_id>.if`에 `always()`를 쓰라고 한다. Understanding GitHub Actions 문서는 job이 기본적으로 의존성이 없어 병렬로 실행되고 각 job이 자기 가상 머신 runner에서 돈다고 하며, workflow 문법 문서는 job `outputs`를 의존하는 job에서 `needs` 컨텍스트로 읽는다고 한다(2026-10-20 원문 확인).
(실험 확인) 위 YAML은 actionlint 1.7.12로 문법 검사를 통과했고, `needs`에 없는 job 이름을 적은 변형(`needs: tset`)은 존재하지 않는 job이라는 오류가 났다. 실행 순서와 건너뜀은 GitHub 서버가 필요해 실험하지 않았다.
