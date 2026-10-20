---
slug: "cic-18"
topic: "dev-cicd"
tier: TRICKY
difficulty: 3
title: "PR 제목 같은 값을 `run` 스크립트에서 `${{ github.event.pull_request.title }}`로 직접 쓰면 왜 위험하고 어떻게 막나요?"
keywords: ["표현식이 스크립트 텍스트로 치환", "스크립트 인젝션", "중간 환경 변수 사용", "신뢰할 수 없는 입력", "action 인자로 전달"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.github.com/en/actions/reference/security/secure-use"]
concepts: [ci-pipeline, web-security]
importance: 1
links: [{to: "cic-06", kind: PREREQ}]
---
**모범 답변 (30~60초)**
`${{ }}` 표현식은 셸이 실행되기 전에 값으로 치환되어 스크립트 문자열 자체가 만들어집니다. 그래서 PR 제목에 따옴표와 세미콜론으로 명령을 끼워 넣으면 그 명령이 러너에서 그대로 실행되는 스크립트 인젝션이 가능합니다. PR 제목, 브랜치 이름, 이슈 본문처럼 외부 사람이 정할 수 있는 값은 모두 신뢰할 수 없는 입력입니다. 막는 방법은 값을 먼저 `env:`의 환경 변수에 넣고 스크립트에서는 `"$TITLE"`처럼 변수로 쓰는 것이고, 그러면 값이 코드가 아니라 데이터로만 다뤄집니다. 그 값을 인자로 받는 별도 액션을 쓰는 방법도 문서가 권장합니다. 여기에 `GITHUB_TOKEN` 권한을 최소로 줄이면 뚫려도 피해가 작아집니다.

```yaml
on: pull_request
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - env:
          TITLE: ${{ github.event.pull_request.title }}
        run: echo "title is $TITLE"
```

(공식 문서) Secure use reference 문서의 스크립트 인젝션 절은 인라인 스크립트로 처리할 때는 표현식 값을 중간 환경 변수에 넣는 방식이 권장되며, 이 방식에서는 `a"; ls $GITHUB_WORKSPACE"` 같은 값을 넣어도 인젝션이 실패한다고 보여 준다. 가장 권장하는 방법은 컨텍스트 값을 인자로 받는 액션을 만드는 것이고, 이때 값은 셸 스크립트 생성에 쓰이지 않는다고 한다. 같은 문서는 `GITHUB_TOKEN`을 필요한 최소 권한으로 제한하라고 한다(2026-10-20 원문 확인).
(실험 확인) 치환을 흉내 낸 셸 실험이다. `title='a"; echo INJECTED-COMMAND-RAN; echo "'`를 스크립트 텍스트 `echo "title is $title"`에 그대로 박아 `sh`로 실행하자 `INJECTED-COMMAND-RAN`이 출력되어 끼워 넣은 명령이 실행됐다. 같은 값을 환경 변수 `TITLE`로 넘기고 `echo "title is $TITLE"`로 쓰자 값 전체가 문자열로만 출력됐다. 이것은 Actions의 치환 방식을 흉내 낸 것이지 Actions 러너에서 실행한 것은 아니다. 또 actionlint 1.7.12는 `run`에서 `github.event.pull_request.title`을 직접 쓴 워크플로에 신뢰할 수 없는 값이니 환경 변수로 넘기라는 경고를 냈고, 위 환경 변수 방식은 경고 없이 통과했다.
