---
slug: "cic-03"
topic: "dev-cicd"
tier: BASIC
difficulty: 1
title: "GitHub Actions의 workflow, event, job, step, runner, action은 각각 무엇이고 어떤 관계인가요?"
keywords: ["workflow는 YAML 파일", "event가 workflow를 시작", "job은 같은 runner에서 실행", "step은 스크립트 또는 action", "runner는 job을 실행하는 서버"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.github.com/en/actions/get-started/understand-github-actions"]
---
**모범 답변 (30~60초)**
workflow는 저장소의 `.github/workflows` 폴더에 YAML 파일로 정의하는 자동화 절차이고, event가 발생하면 시작됩니다. event는 push나 pull request 생성처럼 저장소에서 일어난 일, 스케줄, 수동 실행 같은 것입니다. workflow는 하나 이상의 job으로 이루어지고, job은 같은 runner 하나에서 실행되는 step의 묶음입니다. step은 기본적으로 순서대로 실행되고, 직접 쓴 셸 명령(`run`)이거나 재사용 가능한 action(`uses`)입니다. runner는 job을 실제로 실행하는 서버로, GitHub이 제공하는 Ubuntu, Windows, macOS 가상 머신이나 직접 운영하는 self-hosted runner를 씁니다. job은 기본적으로 서로 독립이라 병렬로 실행됩니다.

(공식 문서) Understanding GitHub Actions 문서는 workflow를 `.github/workflows`에 두는 YAML 파일로, event를 저장소에서 일어나 workflow 실행을 일으키는 활동(스케줄·REST API·수동 실행 포함)으로 설명한다. job은 같은 runner에서 실행되는 step의 집합이고, step은 셸 스크립트이거나 action이며 기본적으로 순서대로 실행된다(일부 step을 동시에 실행하게 할 수도 있다고 한다). action은 재사용 가능한 확장이고, 기본적으로 job에는 의존성이 없어 병렬로 실행된다고 한다. 각 job은 자기 가상 머신 runner나 컨테이너 안에서 돌고, runner 하나는 한 번에 job 하나를 실행하며, 실행마다 새로 프로비저닝된 가상 머신을 쓴다고 한다(2026-10-20 원문 확인).
