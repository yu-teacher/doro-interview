---
slug: "git-13"
topic: "dev-git"
tier: DEEP
difficulty: 2
title: "`git cherry-pick`은 무엇을 하고, 어떤 상황에 쓰며 어떤 부작용이 있나요?"
keywords: ["다른 브랜치의 특정 커밋 적용", "새 커밋 해시 생성", "핫픽스 백포트", "-x로 원본 커밋 기록", "나중 merge 시 중복 커밋"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://git-scm.com/docs/git-cherry-pick", "https://git-scm.com/docs/gitworkflows"]
---
**모범 답변 (30~60초)**
cherry-pick은 다른 브랜치에 있는 특정 커밋이 도입한 변경만 골라 현재 브랜치 끝에 새 커밋으로 적용하는 명령입니다. 운영 중인 릴리스 브랜치에 핫픽스 하나만 가져오는 백포트가 대표적인 용도입니다. 변경 내용은 같아도 부모가 다르므로 해시가 다른 새 커밋이 생기고, 나중에 원래 브랜치를 merge하면 같은 변경이 서로 다른 커밋으로 히스토리에 두 번 보일 수 있습니다. 공개된 브랜치 사이라면 -x로 원본 커밋 ID를 메시지에 남겨 추적할 수 있게 합니다.

(공식 문서) git-cherry-pick 문서는 기존 커밋 각각이 도입한 변경을 적용해 커밋마다 새 커밋을 기록하는 명령이라고 하며, 적용이 어려우면 현재 브랜치와 HEAD는 마지막 성공한 커밋에 머무르고 `CHERRY_PICK_HEAD`가 그 커밋을 가리킨다고 한다. `-x`는 충돌 없이 끝난 cherry-pick에서 메시지에 `(cherry picked from commit ...)` 줄을 덧붙이며, 공개된 브랜치 사이(예: 이전 릴리스에 수정 백포트)에서 유용하고 비공개 브랜치에서는 쓸모없다고 한다. gitworkflows는 merge가 브랜치 단위, cherry-pick이 커밋 단위로 변경을 옮기며 merge가 많은 기여에 더 잘 확장된다고 설명한다.
(실험 확인) Git 2.50.1에서 `hotfix`의 커밋을 `git cherry-pick -x`로 `main`에 가져오자 해시가 다른 새 커밋이 생겼고 메시지에 `(cherry picked from commit ...)`가 붙었다. 두 커밋의 `git patch-id`는 같았다. 이후 `git merge hotfix`는 충돌 없이 성공했고 `fix bug`가 서로 다른 커밋으로 두 번 보이는 히스토리가 되었다.
