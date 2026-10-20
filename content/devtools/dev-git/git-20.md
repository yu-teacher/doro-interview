---
slug: "git-20"
topic: "dev-git"
tier: TRICKY
difficulty: 3
title: "merge 커밋을 `git revert`로 되돌릴 때 `-m` 옵션은 왜 필요하고, 되돌린 뒤 같은 브랜치를 다시 merge하면 어떻게 되나요?"
keywords: ["merge 커밋은 부모가 둘", "-m으로 mainline 지정", "revert는 트리 변경을 취소", "재merge 시 되돌린 변경이 돌아오지 않음", "revert의 revert"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://git-scm.com/docs/git-revert"]
---
**모범 답변 (30~60초)**
merge 커밋은 부모가 둘이라 어느 쪽을 기준으로 되돌릴지 모르기 때문에, git revert -m 1처럼 mainline이 될 부모 번호를 지정해야 합니다. 보통 1번은 merge를 받은 쪽 브랜치입니다. 중요한 함정은 merge 커밋을 revert하면 그 merge로 들어온 변경을 앞으로 원하지 않는다고 선언한 것이 되어, 나중에 같은 브랜치를 다시 merge해도 이전 커밋의 변경은 돌아오지 않고 그 뒤에 새로 생긴 커밋의 변경만 들어온다는 점입니다. 원래 내용을 다시 가져오려면 그 revert 커밋을 다시 revert하는 방법이 있습니다.

(공식 문서) git-revert 문서는 보통 merge는 어느 쪽이 mainline인지 몰라서 되돌릴 수 없고, `-m <parent-number>`로 부모 번호(1부터)를 지정하면 그 부모 기준으로 되돌릴 수 있다고 한다. 또 merge를 revert하는 것은 그 merge가 가져온 트리 변경을 앞으로 원하지 않는다고 선언하는 것이라, 이후 merge는 이전에 revert한 merge의 조상이 아닌 커밋의 변경만 가져온다고 하며 revert-a-faulty-merge How-To를 참고하라고 한다.
(실험 확인) Git 2.50.1에서 `main`에 `feature`(F1, F2)를 `--no-ff`로 merge한 뒤 `git revert --no-edit <merge>`는 `is a merge but no -m option was given`으로 실패했고 `-m 1`은 성공해 F1, F2의 파일이 사라졌다. 그 상태에서 `git merge feature`는 `Already up to date.`였고 파일은 돌아오지 않았다. `feature`에 F3을 추가해 다시 merge하자 F3의 파일만 들어왔다. 이어서 그 revert 커밋을 `git revert`하자 `Reapply "Merge feature"` 커밋이 만들어졌고 F1·F2 파일이 돌아왔다. `main`에서 `--no-ff`로 merge한 커밋의 부모는 1번이 merge 전 `main`, 2번이 `feature`였다.
(보충) 보통 1번 부모가 merge를 받은 쪽이라는 설명은 확인한 공식 문서에 문장으로 없고 위 실험 한 건을 일반화한 것이다. revert-a-faulty-merge How-To의 본문은 확인하지 않았으므로 재merge 절차의 다른 방법(revert의 revert 외)은 다루지 않았다.
