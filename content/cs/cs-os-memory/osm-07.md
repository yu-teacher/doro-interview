---
slug: "osm-07"
topic: "cs-os-memory"
tier: BASIC
difficulty: 2
title: "하드 링크와 심볼릭 링크는 무엇이 다르고, 원본을 지우면 각각 어떻게 되나요?"
keywords: ["하드 링크는 같은 inode의 또 다른 이름", "링크 카운트가 0이 되어야 삭제", "심볼릭 링크는 경로 문자열을 담은 파일", "파일 시스템 경계와 디렉터리", "대상이 없으면 dangling"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://man7.org/linux/man-pages/man7/symlink.7.html", "https://man7.org/linux/man-pages/man2/link.2.html", "https://man7.org/linux/man-pages/man2/unlink.2.html", "https://pubs.opengroup.org/onlinepubs/9799919799/functions/link.html", "https://pubs.opengroup.org/onlinepubs/9799919799/functions/symlink.html", "https://pubs.opengroup.org/onlinepubs/9799919799/functions/unlink.html"]
---
**모범 답변 (30~60초)**
하드 링크는 같은 inode를 가리키는 또 하나의 이름이라서 어느 쪽이 원본인지 구분할 수 없고, 이름을 하나 지워도 링크 수가 남아 있으면 내용이 그대로 있습니다. 링크 수가 0이 되고 열어 둔 프로세스도 없을 때 비로소 내용이 지워집니다. 심볼릭 링크는 다른 경로 문자열을 담은 별도의 파일이라 디렉터리나 다른 파일 시스템도 가리킬 수 있지만, 가리키는 대상이 없어져도 링크 자체는 남아서 끊어진(dangling) 링크가 됩니다. 하드 링크는 파일 시스템 경계를 넘을 수 없고 보통 디렉터리에도 만들 수 없습니다.

(공식 문서) `symlink(7)`은 하드 링크가 같은 inode 번호에 대한 참조라서 원본과 구별되지 않고, 다른 파일 시스템이나 디렉터리에는 만들 수 없다고 하며, 심볼릭 링크는 다른 파일의 경로명을 내용으로 담는 특수 파일이라 디렉터리나 다른 파일 시스템도 가리킬 수 있고 대상이 없을 수도 있다(dangling)고 한다. `unlink`는 링크 수가 0이 되고 열어 둔 곳이 없을 때 공간이 해제되고, 열린 참조가 있으면 내용 삭제가 미뤄진다고 한다. POSIX `link`는 하드 링크 생성 시 링크 수를 1 늘리고, 디렉터리에 대한 링크는 특별한 권한과 구현이 있을 때만 허용한다고 한다.
(실험 확인) macOS에서 `a.txt`에 `ln`으로 `hard.txt`, `ln -s`로 `soft.txt`를 만들자 `a.txt`와 `hard.txt`는 inode와 링크 수 2가 같았고, `soft.txt`는 다른 inode에 크기가 5(문자열 `a.txt`의 길이)였다. `rm a.txt` 뒤 `cat hard.txt`는 내용을 읽었고 `cat soft.txt`는 "No such file or directory"로 실패했다(`ls`에는 끊어진 링크로 남음). 디렉터리에 `ln`을 하자 "Is a directory"로 거부되었다. 파이썬으로 열어 둔 파일을 `unlink`한 뒤에도 파일 디스크립터로 읽혔고 `st_nlink`는 0이었다.
