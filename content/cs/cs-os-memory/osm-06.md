---
slug: "osm-06"
topic: "cs-os-memory"
tier: BASIC
difficulty: 1
title: "파일 시스템에서 inode와 디렉터리는 각각 무엇을 담고, 파일 이름은 어디에 저장되나요?"
keywords: ["inode에 메타데이터", "inode 번호로 식별", "디렉터리는 이름과 inode 연결", "링크 카운트", "이름 변경해도 inode 유지"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://man7.org/linux/man-pages/man7/inode.7.html", "https://man7.org/linux/man-pages/man7/path_resolution.7.html", "https://www.kernel.org/doc/html/latest/filesystems/vfs.html", "https://pubs.opengroup.org/onlinepubs/9799919799/functions/link.html", "https://pubs.opengroup.org/onlinepubs/9799919799/functions/unlink.html", "https://pages.cs.wisc.edu/~remzi/OSTEP/"]
refs: ["OSTEP, 39장 Interlude: Files and Directories(39.1 Files and Directories, 39.14 Hard Links), PDF p.2, 19-20", "OSTEP, 40장 File System Implementation(40.3 File Organization: The Inode, 40.4 Directory Organization), PDF p.5-6, 8-9"]
concepts: [io-filesystem]
importance: 2
links: [{to: "osm-07", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
inode는 파일 하나의 메타데이터를 담는 자료구조로, 파일 종류와 권한, 소유자, 크기, 타임스탬프, 링크 수 같은 정보를 갖고 파일 시스템 안에서 inode 번호로 식별됩니다. 파일 이름은 inode 안이 아니라 디렉터리에 들어 있습니다. 디렉터리는 이름과 inode를 연결해 주는 항목들을 담은 특별한 파일이어서, 같은 inode를 가리키는 이름이 여러 개일 수 있고 이름을 바꿔도 inode는 그대로입니다. 절대 경로를 열 때는 `/`부터 각 구성 요소를 디렉터리에서 차례로 찾아 inode에 도달하고, 링크 수가 0이 되고 열어 둔 곳도 없어야 파일 내용이 지워집니다.

(공식 문서) `inode(7)`은 각 파일이 메타데이터를 담은 inode를 가지며 `stat`으로 읽을 수 있고, inode 번호는 파일 시스템 안에서만 유일하며 링크 수(`st_nlink`)를 포함한다고 설명한다. `path_resolution(7)`은 `/`로 시작하는 경로는 프로세스의 루트 디렉터리에서, 아니면 현재 디렉터리에서 시작해 경로의 각 구성 요소를 현재 디렉터리에서 차례로 찾는 과정을 기술하고, 커널 VFS 문서는 하나의 inode를 여러 dentry(하드 링크 등)가 가리킬 수 있다고 한다. POSIX `link`는 하드 링크를 디렉터리 항목으로 정의하고 링크 수를 하나 늘린다고 하며, POSIX `unlink`는 링크 수가 0이 되고 열어 둔 참조가 없을 때 파일 공간이 해제된다고 한다.
(실험 확인) macOS(Apple Silicon)에서 `a`를 만들고 `stat`하니 inode 20670083, 링크 수 1이었다. `mv a b` 뒤에도 inode는 같았고, `ln b c`로 이름을 하나 더 만들자 `ls -i`에 `b`와 `c`가 같은 inode로 나왔으며 링크 수가 2가 되었다.
(원저자 자료) OSTEP 39장(Interlude: Files and Directories, 39.1)은 디렉터리도 파일처럼 저수준 이름인 inode 번호를 가지지만 내용은 정해져 있어서 (사람이 읽는 이름, 저수준 이름) 쌍의 목록이라고 설명한다. 40장(File System Implementation, 40.3·40.4)은 inode가 권한·소유자·크기·시각·링크 수·데이터 블록 위치 같은 메타데이터를 담는 구조이고(ext2 예시 필드 표에 이름 칸이 없고 주석으로 파일 종류 정보도 inode가 아니라 디렉터리 항목에 있다고 적는다), 디렉터리는 데이터 블록에 (이름, inode 번호) 항목들을 저장하는 특별한 종류의 파일이라고 한다. 39.14는 `link`가 같은 inode 번호를 가리키는 이름을 디렉터리에 하나 더 만들 뿐이며 inode의 링크 수가 0이 될 때 inode와 데이터 블록이 해제된다고 한다. 또 40장은 inode가 하나의 자료구조일 뿐이고 필요한 정보를 담아 효과적으로 조회할 수 있으면 어떤 설계도 가능하다고 하며(PDF p.8), 디렉터리 항목을 단순한 선형 목록으로 저장하는 것도 유일한 방법이 아니어서 XFS는 디렉터리를 B-tree 형태로 저장한다고 적는다(PDF p.9). 따라서 구체적인 디스크 배치는 파일 시스템 설계에 따라 달라진다.
