---
slug: "cic-11"
topic: "dev-cicd"
tier: DEEP
difficulty: 2
title: "GitHub Actions의 environment는 무엇이고, 운영 배포에 수동 승인을 걸려면 어떻게 하나요?"
keywords: ["environment는 배포 대상", "required reviewers 승인", "배포 브랜치·태그 제한", "environment secrets", "승인 전에는 시크릿 접근 불가"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments", "https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments", "https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/control-deployments"]
---
**모범 답변 (30~60초)**
environment는 staging, production 같은 배포 대상을 GitHub에 등록해 보호 규칙과 시크릿을 붙이는 기능입니다. job에 `environment: production`을 적으면 그 환경의 보호 규칙을 모두 통과해야 job이 시작됩니다. 수동 승인은 required reviewers로 걸고, 최대 6명까지 지정하며 한 명만 승인해도 진행됩니다. 이 밖에 일정 시간 기다리게 하는 wait timer, 배포할 수 있는 브랜치나 태그를 제한하는 규칙, 배포를 시작한 사람이 직접 승인하지 못하게 하는 설정이 있습니다. 환경 시크릿은 그 환경을 쓰는 job에서만 보이고, 승인이 나기 전에는 접근할 수 없습니다. 승인을 기다리는 job이 30일 안에 승인되지 않으면 실패합니다.

```yaml
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://example.com
    steps:
      - run: echo deploy
```

(공식 문서) Managing environments 문서는 환경 이름이 255자를 넘을 수 없고 저장소 안에서 유일해야 하며, required reviewers는 최대 6명이고 한 명만 승인해도 job이 진행되고, `Prevent self-review`를 켜면 배포를 시작한 사용자는 승인할 수 없다고 한다. 환경 secrets와 variables는 그 환경을 참조하는 job만 쓰고 보호 규칙을 통과한 뒤에야 접근할 수 있다. 존재하지 않는 환경을 참조하는 워크플로를 실행하면 보호 규칙이 없는 환경이 새로 만들어진다고 한다. Deployments and environments 문서는 wait timer가 1분에서 43,200분(30일) 사이이고, 배포 브랜치·태그를 보호된 브랜치나 지정한 이름 패턴으로 제한할 수 있으며, 기본적으로 관리자는 보호 규칙을 우회할 수 있고 이를 끌 수 있다고 한다. Deploying with GitHub Actions 문서는 승인을 받지 못한 채 30일이 지나면 job이 자동으로 실패한다고 한다. GitHub Free, Pro, Team 플랜에서는 required reviewers와 wait timer가 공개 저장소에서만 쓸 수 있다고 안내한다(2026-10-20 원문 확인).
(실험 확인) 위 YAML은 actionlint 1.7.12로 문법 검사를 통과했다. 승인 대기와 시크릿 접근 제어는 GitHub 서버가 필요해 실험하지 않았다.
