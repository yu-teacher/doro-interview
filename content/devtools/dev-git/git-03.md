---
slug: "git-03"
topic: "dev-git"
tier: BASIC
difficulty: 1
title: "Git에서 브랜치는 무엇이고, HEAD는 무엇인가요? 브랜치를 만들면 실제로 무슨 일이 일어나나요?"
keywords: ["브랜치는 커밋을 가리키는 포인터", "HEAD는 현재 브랜치를 가리킴", "새 커밋 시 브랜치가 전진", "git switch가 HEAD와 워킹 트리 변경", "가벼운 브랜치 생성"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://git-scm.com/book/ko/v2/Git-%EB%B8%8C%EB%9E%9C%EC%B9%98-%EB%B8%8C%EB%9E%9C%EC%B9%98%EB%9E%80-%EB%AC%B4%EC%97%87%EC%9D%B8%EA%B0%80", "https://git-scm.com/book/ko/v2/Git%EC%9D%98-%EB%82%B4%EB%B6%80-Git-Refs", "https://git-scm.com/docs/gitglossary", "https://git-scm.com/docs/git-switch"]
concepts: [git-internals, git-branching]
importance: 3
links: [{to: "git-09", kind: FOLLOWUP}, {to: "git-19", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
Git의 브랜치는 특정 커밋 하나를 가리키는 가벼운 포인터일 뿐입니다. 브랜치를 만들어도 파일을 복사하지 않고 현재 커밋을 가리키는 이름이 하나 생길 뿐이라 만들고 지우는 비용이 매우 작습니다. HEAD는 지금 체크아웃한 브랜치를 가리키는 특별한 포인터이고, 커밋하면 HEAD가 가리키는 브랜치가 새 커밋으로 앞으로 이동합니다. git branch는 브랜치를 만들기만 하고 이동하지 않으며, git switch로 이동하면 HEAD가 옮겨지고 워킹 트리도 그 브랜치의 내용으로 바뀝니다.

(공식 문서) Pro Git 3.1절은 브랜치를 커밋 사이를 가볍게 이동할 수 있는 포인터로, HEAD를 지금 작업하는 로컬 브랜치를 가리키는 특수 포인터로 설명한다. `git branch`는 브랜치를 만들기만 하고 옮기지 않으며, 브랜치를 이동하면 HEAD가 옮겨지고 워킹 디렉터리 파일도 그 시점으로 바뀐다고 한다. 브랜치 하나는 40자 SHA-1 체크섬이 든 41바이트 파일이라고 설명한다(SHA-1 저장소 기준). git-switch 문서는 지정한 브랜치로 전환하면 워킹 트리와 index가 그 브랜치에 맞게 갱신된다고 한다. Git Refs 절은 `.git/HEAD`가 현재 브랜치를 가리키는 간접(symbolic) ref이고 내용이 `ref: refs/heads/master` 형태라고 설명한다. gitglossary는 head를 `refs/heads/` 디렉터리의 파일에 저장된 브랜치 끝 커밋에 대한 이름 있는 참조(packed refs는 예외)로, HEAD를 현재 브랜치로 정의한다.
(실험 확인) Git 2.50.1에서 `git branch topic` 뒤 `.git/refs/heads/topic`은 41바이트 파일이었다. `.git/HEAD`의 내용은 `main`에 있을 때 `ref: refs/heads/main`, `git switch topic` 뒤에는 `ref: refs/heads/topic`이었다.
