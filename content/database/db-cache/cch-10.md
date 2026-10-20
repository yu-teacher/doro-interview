---
slug: "cch-10"
topic: "db-cache"
tier: DEEP
difficulty: 2
title: "AOF의 fsync 정책 세 가지와 AOF 재작성(rewrite)은 무엇인가요?"
keywords: ["appendfsync always·everysec·no", "기본 everysec 최대 1초 유실", "AOF 재작성으로 크기 줄임", "Redis 7 base·incr·manifest", "잘린 AOF 로드"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/"]
concepts: [redis]
importance: 1
---
**모범 답변 (30~60초)**
`appendfsync`는 AOF를 디스크에 언제 동기화할지 정합니다. `always`는 명령을 추가할 때마다 fsync해서 매우 안전하지만 매우 느리고, `everysec`는 초당 한 번이라 빠르면서 장애 때 최대 약 1초의 쓰기를 잃을 수 있어 기본값이며, `no`는 운영체제에 맡겨 더 빠르지만 덜 안전합니다. AOF는 계속 커지기 때문에 Redis가 현재 데이터셋을 만드는 데 필요한 최소 명령 집합으로 백그라운드에서 다시 쓰는 재작성을 하고, 7.0부터는 base 파일과 incr 파일을 manifest가 묶어 가리키며 재작성이 끝나면 매니페스트를 원자적으로 교체합니다. 서버가 쓰다 죽어 마지막 명령이 잘려도 기본 설정은 그 부분만 버리고 로드합니다.

```
appendonly yes
appendfsync everysec
```

(공식 문서) Persistence 페이지에 근거한다. `always`는 배치로 묶인 명령 뒤에 fsync하며 "very slow, very safe", `everysec`는 1초 분량을 잃을 수 있고 제안되는 기본 정책이며, `no`는 운영체제에 맡겨 리눅스는 보통 30초마다 비우지만 커널 설정에 달렸다고 한다. 재작성은 7.0 이상에서 자식 프로세스가 새 base AOF를 만드는 동안 부모는 새 증분 AOF 파일에 계속 쓰고, 준비되면 임시 매니페스트로 원자적으로 교체한다. 마지막 명령이 잘린 AOF는 기본 설정(`aof-load-truncated`)이 비정상 명령만 버리고 가용성을 위해 계속 로드한다고 한다.
(실험 확인) Redis 7.4.11을 `--appendonly yes --appendfsync always`로 띄우면 `appendonlydir`에 `appendonly.aof.1.base.rdb`, `appendonly.aof.1.incr.aof`, `appendonly.aof.manifest`가 생겼고, incr 파일에는 `SELECT`, `SET`, `INCR` 명령이 RESP 형식으로 기록돼 있었다. `BGREWRITEAOF` 뒤에는 시퀀스가 2로 바뀐 `appendonly.aof.2.base.rdb`와 `2.incr.aof`로 교체됐고 `aof_last_bgrewrite_status:ok`였다. 설정 없이 띄운 인스턴스의 `appendfsync`는 `everysec`, `aof-load-truncated`는 `yes`였다. `appendonly.aof.2.incr.aof`의 끝 4바이트를 `truncate`로 잘라 낸 뒤 SIGKILL로 죽였다 시작하자, 로그에 `short read while loading the AOF file`, `Truncating the AOF ... at offset 50`, `loaded anyway because aof-load-truncated is enabled`가 찍혔고, 잘린 마지막 `SET`만 사라지고 앞의 키 a, b, cnt는 복구됐다.
