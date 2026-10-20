---
slug: "git-15"
topic: "dev-git"
tier: DEEP
difficulty: 2
title: "이미 만든 커밋을 고치거나 여러 커밋을 하나로 합치려면 어떻게 하나요? 좋은 커밋 메시지는 어떻게 쓰나요?"
keywords: ["git commit --amend", "interactive rebase", "squash/fixup/reword/drop", "새 커밋으로 대체된 히스토리", "메시지 첫 줄 요약"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://git-scm.com/docs/git-commit", "https://git-scm.com/docs/git-rebase", "https://git-scm.com/docs/gitworkflows", "https://git-scm.com/book/ko/v2/Git-%EB%8F%84%EA%B5%AC-%ED%9E%88%EC%8A%A4%ED%86%A0%EB%A6%AC-%EB%8B%A8%EC%9E%A5%ED%95%98%EA%B8%B0"]
concepts: [git-undo, git-branching]
importance: 2
links: [{to: "git-16", kind: FOLLOWUP}, {to: "git-10", kind: PREREQ}]
---
**모범 답변 (30~60초)**
가장 최근 커밋은 git commit --amend로 내용이나 메시지를 고칩니다. 여러 커밋을 정리하려면 git rebase -i 커밋을 실행해 목록에서 pick을 reword, squash, fixup, drop 등으로 바꿔 메시지 수정, 합치기, 버리기, 순서 바꾸기를 합니다. 두 방법 모두 기존 커밋을 고치는 것이 아니라 새 커밋으로 바꿔치기하는 것이므로 해시가 바뀌고, 이미 push한 커밋에 쓰면 협업자에게 문제가 됩니다. 메시지는 필수는 아니지만 50자 이내의 짧은 요약 한 줄, 빈 줄, 자세한 설명 순서를 권합니다.

(공식 문서) git-commit 문서는 `--amend`가 현재 브랜치 끝을 새 커밋으로 대체하며 부모와 작성자는 그대로이고, 이미 공개한 커밋을 amend하면 히스토리 재작성의 영향을 이해해야 한다고 한다. 메시지의 형식은 강제는 아니지만 50자 이내 요약 한 줄, 빈 줄, 자세한 설명을 권하고 첫 빈 줄까지를 제목으로 Git 전반이 쓴다고 한다. git-rebase 문서의 INTERACTIVE MODE는 `git rebase -i <이 커밋 이후>`로 시작해 `pick`을 `edit`, `reword`, `drop`(또는 줄 삭제), `squash`, `fixup`으로 바꿀 수 있고 순서도 바꿀 수 있으며, 합친 커밋의 작성자는 첫 커밋이라고 한다. gitworkflows는 공개하기 전에 `git rebase --interactive`로 커밋을 정리하라고 하고, Pro Git 7.6절도 `--amend`와 대화형 rebase를 설명한다.
(실험 확인) Git 2.50.1에서 `--amend` 후 새 해시가 생겼고 부모는 같았다. 5개 커밋(base, `feat: add a`, `wip`, `fix typo in a`, `feat: add c`)에서 `GIT_SEQUENCE_EDITOR`로 `wip`를 `drop`, `fix typo`를 `fixup`으로 바꿔 `git rebase -i`를 돌리자 3개(base, `feat: add a`, `feat: add c`)가 되었고 `a`에 fixup한 수정이 합쳐져 있었다. 직전 끝은 `ORIG_HEAD`로 가리켜져 `git reset --hard ORIG_HEAD`로 원래 히스토리를 되살렸다. 중간 커밋 하나를 `reword`하자 그 뒤 커밋의 해시가 모두 바뀌었다.
