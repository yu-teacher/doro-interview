---
slug: "cic-21"
topic: "dev-cicd"
tier: TRICKY
difficulty: 3
title: "브랜치 보호의 required status checks는 CI와 어떻게 연결되고, CI job이 건너뛰어졌는데도 병합이 허용되는 경우는 언제인가요?"
keywords: ["required status checks", "CI job을 필수 체크로 지정", "skipped도 통과로 취급", "job 이름 중복 시 모호", "베이스 최신화 요구(strict)"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches", "https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-jobs"]
---
**모범 답변 (30~60초)**
브랜치 보호 규칙에서 병합 전에 통과해야 할 상태 체크로 CI job을 지정하면, 그 체크가 모두 통과해야 PR을 보호된 브랜치에 병합할 수 있습니다. 문서에 따르면 필수 체크는 성공뿐 아니라 건너뜀(skipped)이나 neutral 상태여도 통과로 취급합니다. 그래서 `needs`로 이어진 앞 job이 실패해서 뒤 job이 건너뛰어지는 구조에서 뒤 job만 필수로 걸어 두면, 건너뛴 체크가 통과로 계산되어 병합이 허용될 수 있습니다. 필수 체크는 실제 검증을 하는 job으로 지정해야 합니다. 또 여러 워크플로에서 job 이름이 겹치면 결과가 모호해 병합이 막힐 수 있으니 이름을 유일하게 하고, strict 설정이면 병합 전에 PR 브랜치를 베이스 브랜치에 최신화해야 합니다.

(공식 문서) About protected branches 문서는 필수 상태 체크가 성공, 건너뜀, neutral 중 하나여야 보호된 브랜치에 변경을 만들 수 있다고 하고, 필수 체크를 쓸 때 여러 워크플로에서 job 이름이 겹치면 모호한 결과가 나와 PR 병합이 막힐 수 있으니 이름을 유일하게 하라고 한다. 필수 체크를 켜면 모든 필수 체크가 통과해야 병합할 수 있고, 엄격(strict) 모드는 병합 전에 브랜치를 베이스 브랜치에 최신화해야 하며 기본 동작이다. 엄격하지 않으면 병합 후에 호환되지 않는 변경으로 체크가 깨질 수 있다. 병합 큐는 최신 대상 브랜치와 큐에 있는 다른 PR을 합친 상태에서 필수 체크를 확인한다고 한다. Using jobs 문서는 선행 job이 실패하거나 건너뛰어지면 그것을 필요로 하는 job이 건너뛰어진다고 한다(2026-10-20 원문 확인).
(보충) 건너뛴 뒤 job만 필수로 걸었을 때 병합이 허용될 수 있다는 결론은 위 두 문서의 내용(skipped를 통과로 취급, 선행 job 실패 시 의존 job은 skipped)을 이은 추론이며, 문서가 이 시나리오를 직접 다루지는 않는다. 어느 브랜치 전략(trunk 기반, 기능 브랜치 등)을 쓰느냐는 CI 설정과 별개의 팀 결정이며 이 문서들이 정해 주지 않는다. 실험하지 않았다.
