---
slug: "cch-05"
topic: "db-cache"
tier: BASIC
difficulty: 2
title: "Redis의 영속성 방식인 RDB와 AOF는 무엇이 다르고, 어떻게 골라야 하나요?"
keywords: ["RDB 시점 스냅샷", "AOF 쓰기 로그", "마지막 스냅샷 이후 유실", "AOF fsync 정책", "캐시 용도는 영속성 끄기 가능"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/", "https://raw.githubusercontent.com/redis/redis/7.4/redis.conf"]
concepts: [redis]
importance: 2
links: [{to: "cch-10", kind: FOLLOWUP}, {to: "osm-13", kind: RELATED}]
---
**모범 답변 (30~60초)**
RDB는 정해 둔 주기마다 데이터셋 전체를 하나의 파일로 찍는 시점 스냅샷이고, AOF는 받은 쓰기 명령을 계속 로그로 남겼다가 재시작 때 다시 실행해 복구하는 방식입니다. RDB는 파일이 작고 재시작이 빠르지만, 장애가 나면 마지막 스냅샷 이후 몇 분의 데이터를 잃을 수 있습니다. AOF는 fsync 정책을 고를 수 있고 기본인 매초 방식이면 최대 1초 정도만 잃어 내구성이 더 좋은 대신 파일이 보통 더 크고 정책에 따라 느릴 수 있습니다. 둘을 함께 쓸 수 있고 이 경우 재시작할 때는 더 완전한 AOF를 읽습니다. 순수 캐시라면 영속성을 끄는 선택도 있습니다.

```
# redis.conf 예 (7.4.11의 기본 save 값)
save 3600 1 300 100 60 10000   # RDB 스냅샷 조건
appendonly yes                  # AOF 켜기
appendfsync everysec
```

(공식 문서) Persistence 페이지에 근거한다. RDB는 백업과 재해 복구에 좋고 부모 프로세스가 fork만 하며 큰 데이터셋 재시작이 AOF보다 빠르지만, 비정상 종료 시 마지막 몇 분의 데이터 손실을 감수해야 하고 fork가 큰 데이터셋에서 수 밀리초에서 1초까지 클라이언트 서비스를 멈출 수 있다고 한다. AOF는 fsync 정책으로 최대 1초 유실을 목표로 할 수 있고, 로그는 추가만 하므로 정전에도 손상이 없으며, 보통 RDB보다 크고 정책에 따라 느릴 수 있다고 한다. 영속성을 끄는 것도 캐시로 쓸 때 가끔 쓰는 선택지로 소개하며, 둘을 같이 켜고 재시작하면 AOF가 가장 완전하다고 보고 그것으로 복원한다.
(실험 확인) 기본 설정 7.4.11(`save 3600 1 300 100 60 10000`, `appendonly no`)에서 `SET a 1` 직후 컨테이너를 `docker kill`(SIGKILL)로 죽였다 시작하자 `DBSIZE`가 0이었다. 같은 조건에서 `docker stop`(SIGTERM)으로 종료했다 시작하면 `dump.rdb`가 만들어져 1이었다. `--appendonly yes --appendfsync always`로 띄우고 `SET`과 `INCR` 두 번 뒤 SIGKILL로 죽였다 시작하자 키 2개와 `cnt=2`가 복구됐고 `appendonlydir`가 생겼다.
