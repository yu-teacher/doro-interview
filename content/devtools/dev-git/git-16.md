---
slug: "git-16"
topic: "dev-git"
tier: TRICKY
difficulty: 3
title: "이미 push해서 다른 사람이 쓰는 브랜치를 rebase하면 안 된다고 하는데, 왜 안 되고 실제로 어떤 일이 생기나요?"
keywords: ["rebase는 커밋을 새로 만듦", "같은 내용 커밋이 중복", "force push 필요", "동료의 로컬 히스토리와 불일치", "push 전 정리는 괜찮음"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://git-scm.com/docs/git-rebase", "https://git-scm.com/book/ko/v2/Git-%EB%B8%8C%EB%9E%9C%EC%B9%98-Rebase-%ED%95%98%EA%B8%B0", "https://git-scm.com/docs/git-push"]
concepts: [git-branching]
importance: 2
links: [{to: "git-17", kind: FOLLOWUP}, {to: "git-10", kind: PREREQ}]
---
**모범 답변 (30~60초)**
rebase는 커밋을 옮기는 것이 아니라 내용은 같고 해시가 다른 새 커밋을 만들어 대체합니다. 이미 push한 브랜치를 rebase하면 원격 히스토리를 덮어쓰려고 force push가 필요한데, 그 사이 그 브랜치 위에 작업한 동료의 로컬에는 옛 커밋이 남아 있습니다. 동료가 merge 방식(`--no-rebase`)으로 pull하면 옛 커밋과 새 커밋이 둘 다 들어와 같은 변경이 중복되고 불필요한 merge 커밋도 생깁니다. 충돌 해결이나 squash로 내용이 달라졌다면 동료가 히스토리를 수동으로 고쳐야 합니다. 그래서 push 전에 정리하거나 나만 쓰는 브랜치에서만 rebase합니다.

(공식 문서) git-rebase 문서의 RECOVERING FROM UPSTREAM REBASE 절은 다른 사람이 그 위에 작업한 브랜치를 rebase(또는 어떤 형태든 재작성)하는 것은 나쁜 생각이며 하위 작업자는 히스토리를 수동으로 고쳐야 한다고 하고, 계속 개발한 뒤 합치면 원래 커밋이 영구히 중복된다고 그림으로 보여 준다. 해결은 처음부터 상위를 rebase하지 않는 것이라고 한다. 다만 재작성 전후의 패치 내용이 같은 단순한 경우(쉬운 경우)에는 하위 작업자가 `git rebase`로 이미 반영된 변경을 건너뛰며 정리할 수 있고, 충돌 해결·`--interactive` 편집·amend·reset 등으로 내용이 달라진 어려운 경우에는 옛 끝 지점을 직접 알려 주어야 한다고 한다. Pro Git 3.6절은 이미 공개 저장소에 push한 커밋을 rebase하지 말라고 하고, 같은 내용이 두 번 커밋될 수 있다고 하며, push 전 정리나 혼자 쓰는 rebase는 괜찮다고 한다.
(실험 확인) Git 2.50.1에서 alice가 `feature`에 A1을 push했고 bob이 이를 받아 그 위에 B1을 로컬에서 커밋해 둔 상태에서, alice가 main 위로 rebase해 만든 A1'(해시 변경)을 `--force-with-lease`로 push했다. bob이 fetch하자 `ahead 2, behind 2`였고, `git pull --no-rebase`는 merge 커밋을 만들었으며 로그에 A1과 A1'가 둘 다 나타났다(같은 `A1` 메시지 커밋이 두 개). 같은 상황의 복사본에서 `git pull --rebase`는 A1을 중복 없이 건너뛰고 B1만 새 A1 위에 올려 선형 히스토리가 되었다(단순 rebase인 쉬운 경우).
(보충) 개인 기능 브랜치를 rebase하고 force push하는 것을 팀이 합의해 두는 방식은 흔한 관행이지만 공식 문서의 권고는 아니다.
