---
slug: "git-22"
topic: "dev-git"
tier: DEEP
difficulty: 2
title: "Git Flow나 트렁크 기반 개발 같은 브랜치 전략을 Git 공식 문서는 어떻게 다루나요? 브랜치는 어떻게 운용하라고 하나요?"
keywords: ["토픽 브랜치", "장기 브랜치(Long-Running)", "오래된 브랜치에서 분기 후 위로 merge", "merge는 브랜치 단위, cherry-pick은 커밋 단위", "팀 상황에 맞는 선택"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://git-scm.com/book/ko/v2/Git-%EB%B8%8C%EB%9E%9C%EC%B9%98-%EB%B8%8C%EB%9E%9C%EC%B9%98-%EC%9B%8C%ED%81%AC%ED%94%8C%EB%A1%9C", "https://git-scm.com/docs/gitworkflows"]
concepts: [git-branching]
importance: 2
links: [{to: "cic-01", kind: RELATED}, {to: "cic-21", kind: RELATED}]
---
**모범 답변 (30~60초)**
읽은 공식 문서에는 Git Flow나 트렁크 기반 개발이라는 이름의 전략이 정의되어 있지 않고, Git이 제공하는 브랜치 운용 방식만 설명합니다. Pro Git은 안정 코드만 두는 master와 테스트용 develop이나 next 같은 장기 브랜치, 그리고 주제 하나를 위한 짧은 토픽 브랜치를 소개합니다. gitworkflows는 기능이나 버그마다 토픽 브랜치를 만들고 이를 필요한 가장 오래된 통합 브랜치에서 갈라 위쪽 브랜치로 merge하며, 상위 브랜치를 하위 브랜치로 merge하는 것은 API 변경 같은 분명한 사유가 있을 때만 하라고 합니다. 어떤 전략을 택할지는 팀 규모와 배포 방식에 따라 정합니다.

(공식 문서) Pro Git 3.4절은 안정 코드만 master에 두고 개발·안정화용 develop이나 next 브랜치를 두는 Long-Running 브랜치와, 한 가지 주제를 위한 짧은 토픽 브랜치를 설명하며 토픽 브랜치는 프로젝트 크기와 상관없이 유용하다고 한다. gitworkflows는 git.git 자체의 워크플로를 설명하며 이를 글자 그대로 따르지 말라고 하고, 변경을 작게 나눠 커밋할 것, 토픽 브랜치를 오래된 통합 브랜치에서 분기하고 가장 오래된 지원 브랜치에 수정을 커밋한 뒤 통합 브랜치들을 위로 merge할 것(merge upwards), 상위 변경을 하위에 합치는 것은 명확한 사유가 있을 때만 하라고 한다. merge는 브랜치 단위, cherry-pick은 커밋 단위라고 한다. 읽은 문서 중 'Git Flow'나 트렁크 기반 개발을 이름 붙여 설명한 곳은 없었다(Pro Git 일부 절에서 'trunk'는 SVN 저장소의 디렉터리 이름으로만 나온다).
(보충) 잦은 통합과 짧게 사는 브랜치가 충돌을 줄이고, 릴리스 주기가 긴 제품은 장기 브랜치를 둔다는 식의 비교는 일반적인 실무 설명이며 공식 문서가 두 전략의 우열을 정한 것이 아니다.
