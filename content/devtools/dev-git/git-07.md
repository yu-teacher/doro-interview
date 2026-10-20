---
slug: "git-07"
topic: "dev-git"
tier: BASIC
difficulty: 1
title: "merge 중 충돌(conflict)이 나면 어떤 순서로 해결하나요?"
keywords: ["같은 영역을 양쪽이 수정", "충돌 표식 직접 편집", "git add로 해결 표시", "commit 또는 merge --continue", "merge --abort로 취소"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://git-scm.com/docs/git-merge"]
---
**모범 답변 (30~60초)**
두 브랜치가 같은 파일의 같은 영역을 서로 다르게 고치면 Git은 한쪽을 임의로 고르지 않고 merge를 멈추고 충돌 표식을 남깁니다. git status로 충돌 파일을 확인하고, 파일 안의 표식 사이에서 양쪽 내용을 보고 최종 내용으로 직접 고친 뒤 표식을 지웁니다. 그다음 git add로 해결했다고 표시하고 git commit이나 git merge --continue로 merge 커밋을 마무리합니다. 해결하지 않고 포기하려면 git merge --abort로 merge 전 상태로 돌아갑니다.

(공식 문서) git-merge 문서는 충돌이 나면 HEAD는 그대로 두고 `MERGE_HEAD`를 만들며, 깨끗이 합쳐진 경로는 index와 워킹 트리에 반영하고 충돌 경로는 index에 stage 1(공통 조상), 2(HEAD), 3(`MERGE_HEAD`)을 기록하고 워킹 트리 파일에 충돌 표식(`<<<<<<<`, `=======`, `>>>>>>>`)을 넣는다고 한다. 해결 방법으로 파일을 편집해 `git add`한 뒤 `git commit` 또는 `git merge --continue`를 하거나, 합치지 않으려면 `git merge --abort`를 쓰라고 한다. `merge.conflictStyle`을 `diff3`나 `zdiff3`로 두면 `|||||||` 아래에 공통 조상의 원문도 보여 준다고 한다.
(실험 확인) Git 2.50.1에서 양쪽이 `line2`를 다르게 바꾼 merge는 `CONFLICT (content)`와 함께 종료 코드 1로 멈췄고 상태는 `UU f.txt`, `git ls-files -u`는 stage 1·2·3 세 항목을 보여 주었다. `git show :2:f.txt`는 HEAD 쪽 `line2-MAIN`, `:3:`은 병합 대상 쪽 `line2-A`였다. `git merge --abort` 후 `MERGE_HEAD`가 없어지고 상태가 깨끗해졌다. 직접 고쳐 `git add`, `git commit` 하자 부모가 둘인 merge 커밋이 만들어졌다. `zdiff3` 설정에서는 `|||||||` 아래에 원본 `line2`가 나왔다.
