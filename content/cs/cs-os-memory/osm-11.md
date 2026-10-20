---
slug: "osm-11"
topic: "cs-os-memory"
tier: DEEP
difficulty: 2
title: "mmap으로 파일을 매핑하면 read/write와 무엇이 다르고, MAP_SHARED와 MAP_PRIVATE는 어떻게 다른가요?"
keywords: ["파일을 주소 공간에 매핑", "접근 시 페이지 폴트로 로드", "MAP_SHARED는 파일에 반영", "MAP_PRIVATE는 copy-on-write", "반영 시점은 msync"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://pubs.opengroup.org/onlinepubs/9799919799/functions/mmap.html", "https://man7.org/linux/man-pages/man2/mmap.2.html", "https://www.kernel.org/doc/html/latest/admin-guide/mm/concepts.html"]
concepts: [virtual-memory, io-filesystem]
importance: 1
links: [{to: "osm-20", kind: FOLLOWUP}, {to: "osm-09", kind: PREREQ}]
---
**모범 답변 (30~60초)**
`mmap`은 파일의 일정 구간을 프로세스의 주소 공간에 매핑해서 포인터로 메모리처럼 읽고 쓰게 해 주는 시스템 콜입니다. `read`처럼 호출할 때마다 사용자 버퍼로 읽는 대신, 매핑된 주소에 처음 접근할 때 페이지 폴트가 나고 커널이 페이지 캐시의 페이지를 연결해 줍니다. `MAP_SHARED`는 쓴 내용이 같은 영역을 매핑한 다른 프로세스에 보이고 파일에도 반영되며 정확한 반영 시점은 `msync`로 제어합니다. `MAP_PRIVATE`는 쓰면 copy-on-write 사본이 생겨서 파일은 바뀌지 않습니다.

```c
char *s = mmap(0, ps, PROT_READ|PROT_WRITE, MAP_SHARED,  fd, 0);
char *p = mmap(0, ps, PROT_READ|PROT_WRITE, MAP_PRIVATE, fd, 0);
s[0] = 'J';   // 파일에 반영된다
p[1] = 'X';   // 이 프로세스의 사본에만 반영된다
```

(공식 문서) POSIX `mmap`(DESCRIPTION)은 `MAP_SHARED`의 쓰기는 하부 객체를 바꾸고, `MAP_PRIVATE`의 변경은 호출 프로세스에만 보이며 하부 객체를 바꾸지 않는다고 한다. 매핑 후 하부 객체가 바뀐 것이 `MAP_PRIVATE` 매핑에 보이는지는 unspecified이다. APPLICATION USAGE는 `mmap`이 `read`/`write` 대신 주소 공간 조작으로 자원에 접근하게 해 준다고 한다. Linux `mmap(2)`는 `MAP_SHARED`의 갱신이 같은 영역을 매핑한 다른 프로세스에 보이고 파일에도 반영되며 반영 시점을 정확히 제어하려면 `msync(2)`가 필요하다고 하고, `MAP_PRIVATE`를 private copy-on-write 매핑이라 한다. 파일 매핑은 `mmap` 반환 뒤 fd를 닫아도 유효하다.
(실험 확인) macOS(Apple Silicon)에서 11바이트 파일 "hello world"에 위 코드를 실행한 뒤 별도 `pread`로 파일을 읽었다. `s[0]='J'` 뒤에는 "Jello world"로 파일이 바뀌었고, `p[1]='X'`를 쓴 뒤에도 파일은 "Jello world" 그대로였으며 private 매핑 쪽에서만 `X`가 보였다. 이때 private 매핑의 첫 글자는 'J'가 아니라 원래 값 'h'였는데, 매핑 뒤 파일 변경이 `MAP_PRIVATE`에 보이는지는 unspecified라는 POSIX 서술과 맞는 관찰이다. 익명 매핑을 `fork` 뒤 자식이 고치면 `MAP_SHARED`는 부모에게 보이고 `MAP_PRIVATE`는 보이지 않았다.
(보충) 접근 시 페이지 폴트가 나고 페이지 캐시의 페이지가 연결된다는 설명은 문서가 직접 서술하지 않는다(`mmap(2)`가 매핑 페이지의 페이지 캐시 상주 여부를 `mincore`로 알 수 있다고만 말한다). `read`는 커널 버퍼에서 사용자 버퍼로 복사하고 `mmap`은 그 복사를 피한다는 설명과 "큰 파일의 랜덤 접근에 유리하다"는 실무 판단도 참고한 문서가 직접 서술한 내용이 아니며, 폴트 비용이나 오류 처리(SIGBUS) 때문에 항상 빠르지는 않다.
