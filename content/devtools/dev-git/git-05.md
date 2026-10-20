---
slug: "git-05"
topic: "dev-git"
tier: BASIC
difficulty: 2
title: "`.gitignore`에 파일을 추가했는데도 Git이 계속 그 파일의 변경을 추적한다면 어떻게 해야 하나요?"
keywords: [".gitignore는 추적 안 된 파일에만 적용", "이미 추적 중인 파일", "git rm --cached", "커밋 후 .gitignore 반영", "과거 히스토리에는 남음"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://git-scm.com/docs/gitignore", "https://git-scm.com/docs/git-rm"]
---
**모범 답변 (30~60초)**
.gitignore는 아직 추적되지 않는 파일을 무시하게 하는 장치라서, 이미 커밋되어 추적 중인 파일에는 영향이 없고 변경도 계속 감지됩니다. 추적을 멈추려면 git rm --cached 파일로 index에서만 제거하고 .gitignore에 패턴을 넣은 뒤 커밋합니다. --cached를 쓰면 워킹 트리의 파일은 지워지지 않습니다. 단 과거 커밋에는 그 파일이 그대로 남아 있으므로, 비밀번호 같은 값을 실수로 커밋했다면 추적을 끊는 것만으로는 부족합니다.

(공식 문서) gitignore 문서는 이미 Git이 추적하는 파일에는 영향이 없고, 현재 추적 중인 파일의 추적을 멈추려면 `git rm --cached`로 index에서 제거한 뒤 파일 이름을 `.gitignore`에 넣으면 이후 커밋에 다시 들어오지 않는다고 한다. git-rm 문서는 `--cached`를 주면 index에서만 제거할 수 있다고 한다. gitignore 문서는 `!`로 다시 포함시키려 해도 상위 디렉터리가 제외되어 있으면 소용없다고 설명한다.
(실험 확인) Git 2.50.1에서 `.env`를 커밋한 뒤 `.gitignore`에 `.env`를 추가하고 `.env`를 수정하자 `git status`에 ` M .env`가 계속 나타났다. `git rm --cached .env` 후에는 `D  .env`로 바뀌었고 파일은 디스크에 남았다. 커밋 뒤 `git ls-files`에서 `.env`가 사라졌지만 `git show HEAD~2:.env`로 과거 내용(`secret=1`)을 그대로 읽을 수 있었다. `logs/`를 제외하고 `!logs/keep.txt`로 예외를 두어도 `git check-ignore -v`는 `logs/keep.txt`가 `logs/` 규칙에 걸린다고 답했다.
(보충) 이미 올린 비밀 값은 히스토리 정리보다 먼저 폐기·교체해야 한다는 조언은 일반적인 보안 실무이며 이번에 읽은 공식 문서에는 없다.
