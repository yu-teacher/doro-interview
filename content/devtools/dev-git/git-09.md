---
slug: "git-09"
topic: "dev-git"
tier: DEEP
difficulty: 2
title: "fast-forward merge와 3-way merge(merge 커밋)는 언제 각각 일어나고, `--no-ff`는 무엇을 바꾸나요?"
keywords: ["fast-forward는 포인터만 이동", "현재 브랜치가 조상일 때", "3-way merge와 merge 커밋", "부모가 두 개", "--no-ff로 merge 커밋 강제"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://git-scm.com/docs/git-merge", "https://git-scm.com/docs/gitglossary", "https://git-scm.com/book/ko/v2/Git-%EB%B8%8C%EB%9E%9C%EC%B9%98-%EB%B8%8C%EB%9E%9C%EC%B9%98%EC%99%80-Merge-%EC%9D%98-%EA%B8%B0%EC%B4%88"]
concepts: [git-branching]
importance: 2
links: [{to: "git-10", kind: FOLLOWUP}, {to: "git-20", kind: FOLLOWUP}, {to: "git-03", kind: PREREQ}]
---
**모범 답변 (30~60초)**
합치려는 브랜치가 현재 브랜치의 후손이면, 즉 현재 브랜치에서 갈라진 뒤 한쪽만 앞으로 나갔다면 Git은 새 커밋을 만들지 않고 브랜치 포인터만 앞으로 옮기는 fast-forward를 합니다. 양쪽에 서로 다른 커밋이 있으면 공통 조상과 두 브랜치 끝을 비교하는 3-way merge로 결과를 만들고, 부모가 둘인 merge 커밋을 기록합니다. --no-ff는 fast-forward가 가능해도 merge 커밋을 만들게 해서, 그 기능이 한 덩어리로 합쳐졌다는 흔적을 히스토리에 남깁니다.

(공식 문서) git-merge 문서는 현재 브랜치 head가 지정한 커밋의 조상이면 새 merge 커밋 없이 HEAD(와 index)가 그 커밋을 가리키도록 갱신하고, `--no-ff`로 이를 막을 수 있다고 한다. fast-forward가 아닌 경우 합치는 브랜치들을 둘 모두를 부모로 가진 merge 커밋으로 묶는다고 한다. MERGING TAG 절은 주석 태그를 merge하면 fast-forward가 가능해도 merge 커밋을 만든다고 쓰지만, `--ff` 설명은 `--no-ff`가 가정되는 경우를 태그가 `refs/tags/` 밖에 저장된 때로 한정한다. gitglossary의 fast-forward 항목은 후손 브랜치를 merge할 때 새 merge 커밋 없이 브랜치가 같은 커밋을 가리키게 갱신하는 것이라고 한다.
(실험 확인) Git 2.50.1에서 `main`의 후손인 `feat`를 `git merge feat`하자 `Fast-forward`로 끝났고 새 커밋 없이 `main`이 `feat`의 커밋을 가리켰다(HEAD의 `parent` 줄 1개). 후손인 `feat2`를 `--no-ff`로 merge하자 `Merge made by the 'ort' strategy.`와 함께 `parent`가 2개인 커밋이 생겼다. 양쪽에 각자 커밋이 있는 `feat3`는 옵션 없이도 `parent` 2개의 merge 커밋이 되었다. `refs/tags/` 안의 주석 태그(후손 커밋을 가리킴)를 `git merge`하자 이 환경에서는 Fast-forward였다(`-m`은 무시됨).
