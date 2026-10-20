---
slug: "cic-01"
topic: "dev-cicd"
tier: BASIC
difficulty: 1
title: "CI와 CD는 각각 무엇이고, Continuous Delivery와 Continuous Deployment는 어떻게 다른가요?"
keywords: ["변경을 자주 합치는 자동 빌드·테스트", "배포 가능한 상태 유지", "Delivery는 수동 승인 후 반영", "Deployment는 자동으로 운영 반영", "승인 단계 유무"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.github.com/en/actions/get-started/understand-github-actions", "https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments"]
concepts: [ci-pipeline]
importance: 3
links: [{to: "cic-02", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
CI(지속적 통합)는 개발자가 변경을 공유 브랜치에 자주 합치고, 합칠 때마다 빌드와 테스트를 자동으로 돌려 문제를 빨리 발견하는 방식입니다. CD는 그 뒤의 배포까지 자동화하는 것인데 두 가지로 나뉩니다. Continuous Delivery는 테스트를 통과한 결과물을 언제든 배포할 수 있는 상태로 유지하고, 운영 반영은 사람이 승인해서 하는 방식입니다. Continuous Deployment는 승인 단계 없이 파이프라인을 통과하면 운영까지 자동으로 나갑니다. 어느 쪽을 쓸지는 테스트에 대한 신뢰와 팀이 감수할 위험으로 정하고, 같은 파이프라인에서 마지막 승인 단계만 넣거나 빼서 바꿀 수 있습니다.

(공식 문서) Understanding GitHub Actions 문서는 GitHub Actions를 빌드·테스트·배포 파이프라인을 자동화하는 CI/CD 플랫폼이라고 소개하고, 모든 pull request를 빌드·테스트하는 워크플로나 병합된 pull request를 운영에 배포하는 워크플로를 예로 든다. Deployments and environments 문서는 환경(environment)에 required reviewers 규칙을 걸면 지정한 사람이 승인해야 job이 진행된다고 설명하므로, 배포 직전에 수동 승인을 두는 Delivery 방식은 이 기능으로 구성할 수 있다(2026-10-20 원문 확인).
(보충) Continuous Delivery와 Continuous Deployment라는 용어의 정의와 구분은 위 문서들이 내리지 않은 일반 설명이다. 자료에 따라 둘을 CD 한 단어로 섞어 부르기도 하므로, 면접에서는 약어를 풀어 쓰고 승인 단계가 있는지로 구분해 답하는 것이 안전하다.
