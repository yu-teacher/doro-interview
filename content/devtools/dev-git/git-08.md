---
slug: "git-08"
topic: "dev-git"
tier: DEEP
difficulty: 2
title: "Git이 내부에 저장하는 객체(blob, tree, commit, tag)는 각각 무엇이고 어떻게 연결되나요?"
keywords: ["blob은 파일 내용", "tree는 디렉터리", "commit은 tree와 부모 참조", "tag 객체", "내용 기반 해시 이름"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://git-scm.com/docs/gitglossary", "https://git-scm.com/book/ko/v2/Git%EC%9D%98-%EB%82%B4%EB%B6%80-Git-%EA%B0%9C%EC%B2%B4"]
concepts: [git-internals]
importance: 2
links: [{to: "git-14", kind: FOLLOWUP}, {to: "git-01", kind: PREREQ}, {to: "git-02", kind: PREREQ}]
---
**모범 답변 (30~60초)**
Git은 내용으로 이름을 정하는 객체 데이터베이스입니다. blob은 파일의 내용만 담고 파일 이름은 담지 않으며, tree는 디렉터리에 해당해서 이름과 모드, 그리고 blob이나 하위 tree를 가리키는 참조의 목록입니다. commit은 최상위 tree, 작성자와 커미터, 메시지, 부모 커밋을 담고, 부모 참조로 이어져 방향이 있고 순환이 없는 그래프를 이룹니다. tag 객체는 다른 객체에 이름과 메시지를 붙인 것이고 서명을 담을 수도 있습니다. 객체 이름은 내용에서 계산한 해시라서 내용이 같으면 같은 객체를 공유합니다.

(공식 문서) gitglossary는 blob을 파일 내용 같은 타입 없는 객체, tree를 파일 이름과 모드와 blob 또는 하위 tree 참조의 목록(디렉터리에 해당), commit을 부모·커미터·작성자·날짜와 최상위 디렉터리의 tree를 담은 객체, tag object를 다른 객체를 가리키며 커밋처럼 메시지와 서명을 담을 수 있는 객체로 정의한다. 커밋 객체가 부모를 가져 방향 비순환 그래프(DAG)를 이룬다고도 한다. 객체 이름은 보통 40자리 16진수 문자열이라고 한다. Pro Git 10.2절은 blob·tree·commit 개체를 직접 만들어 보며 이 구조를 보여 주고, 객체 이름이 헤더와 내용에 대한 SHA-1 해시이며 blob에는 파일 내용만 저장하고 파일 이름은 tree에 들어간다고 설명한다.
(실험 확인) Git 2.50.1에서 `git cat-file -t`는 각각 `commit`, `tree`, `blob`, 그리고 주석 태그에 `tag`를 출력했다. `git cat-file -p HEAD`는 `tree`, `author`, `committer`와 메시지(부모가 있는 커밋에는 `parent`)를 보여 주었고, tree에는 `100644 blob ... a.txt`와 `040000 tree ... sub`가 나열되었다. `git hash-object a.txt`의 값은 커밋된 `HEAD:a.txt`의 blob ID와 같았고, 내용이 같은 두 파일(`a.txt`, `a2.txt`)은 같은 blob ID를 가졌다.
