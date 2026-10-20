---
slug: "osm-06"
topic: "cs-os-memory"
tier: BASIC
difficulty: 1
title: "파일 시스템에서 inode와 디렉터리는 각각 무엇을 담고, 파일 이름은 어디에 저장되나요?"
keywords: ["inode에 메타데이터", "inode 번호로 식별", "디렉터리는 이름과 inode 연결", "링크 카운트", "이름 변경해도 inode 유지"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://man7.org/linux/man-pages/man7/inode.7.html", "https://man7.org/linux/man-pages/man7/path_resolution.7.html", "https://www.kernel.org/doc/html/latest/filesystems/vfs.html", "https://pubs.opengroup.org/onlinepubs/9799919799/functions/link.html", "https://pubs.opengroup.org/onlinepubs/9799919799/functions/unlink.html"]
---
**모범 답변 (30~60초)**
inode는 파일 하나의 메타데이터를 담는 자료구조로, 파일 종류와 권한, 소유자, 크기, 타임스탬프, 링크 수 같은 정보를 갖고 파일 시스템 안에서 inode 번호로 식별됩니다. 파일 이름은 inode 안이 아니라 디렉터리에 들어 있습니다. 디렉터리는 이름과 inode를 연결해 주는 항목들을 담은 특별한 파일이어서, 같은 inode를 가리키는 이름이 여러 개일 수 있고 이름을 바꿔도 inode는 그대로입니다. 절대 경로를 열 때는 `/`부터 각 구성 요소를 디렉터리에서 차례로 찾아 inode에 도달하고, 링크 수가 0이 되고 열어 둔 곳도 없어야 파일 내용이 지워집니다.

(공식 문서) `inode(7)`은 각 파일이 메타데이터를 담은 inode를 가지며 `stat`으로 읽을 수 있고, inode 번호는 파일 시스템 안에서만 유일하며 링크 수(`st_nlink`)를 포함한다고 설명한다. `path_resolution(7)`은 `/`로 시작하는 경로는 프로세스의 루트 디렉터리에서, 아니면 현재 디렉터리에서 시작해 경로의 각 구성 요소를 현재 디렉터리에서 차례로 찾는 과정을 기술하고, 커널 VFS 문서는 하나의 inode를 여러 dentry(하드 링크 등)가 가리킬 수 있다고 한다. POSIX `link`는 하드 링크를 디렉터리 항목으로 정의하고 링크 수를 하나 늘린다고 하며, POSIX `unlink`는 링크 수가 0이 되고 열어 둔 참조가 없을 때 파일 공간이 해제된다고 한다.
(실험 확인) macOS(Apple Silicon)에서 `a`를 만들고 `stat`하니 inode 20670083, 링크 수 1이었다. `mv a b` 뒤에도 inode는 같았고, `ln b c`로 이름을 하나 더 만들자 `ls -i`에 `b`와 `c`가 같은 inode로 나왔으며 링크 수가 2가 되었다.
(보충) "이름이 inode 안이 아니라 디렉터리에 있다"는 문장과 "디렉터리는 항목들을 담은 특별한 파일"이라는 표현은 위 문서들(inode 필드 목록에 이름이 없고, 하드 링크가 디렉터리 항목이며 같은 inode를 여러 이름이 가리킴)에서 이끌어낸 설명이며, 디스크 위 구체적 배치는 파일 시스템마다 다르다.
