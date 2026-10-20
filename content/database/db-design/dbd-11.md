---
slug: "dbd-11"
topic: "db-design"
tier: DEEP
difficulty: 2
title: "PostgreSQL 스트리밍 복제는 어떻게 동작하고, 동기 복제와 비동기 복제는 무엇이 다른가요?"
keywords: ["WAL 스트리밍", "물리 복제", "기본은 비동기", "synchronous_standby_names", "커밋 지연 증가"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/warm-standby.html", "https://dev.mysql.com/doc/refman/8.4/en/replication-implementation.html"]
---
**모범 답변 (30~60초)**
스트리밍 복제는 primary가 만든 WAL 레코드를 standby가 네트워크로 받아 계속 재생해서 primary를 그대로 따라가는 물리 복제입니다. 기본은 비동기라서 primary가 커밋한 뒤 조금 늦게 standby에 반영되고, primary가 갑자기 죽으면 아직 전달되지 않은 커밋은 잃을 수 있습니다. synchronous_standby_names를 설정하면 커밋이 standby의 확인을 기다리는 동기 복제가 되어 유실 위험은 줄지만 응답 시간이 최소한 primary와 standby 사이 왕복 시간만큼 늘어납니다. synchronous_commit 값으로 어느 단계까지 기다릴지 정합니다.

```sql
-- primary에서 복제 상태 확인
SELECT application_name, state, sync_state, replay_lag FROM pg_stat_replication;
```

(공식 문서) PostgreSQL 16 warm-standby 페이지는 스트리밍 복제에서 standby가 primary에 연결해 WAL 레코드를 파일이 차기를 기다리지 않고 받으며, 기본은 비동기여서 커밋과 standby 반영 사이에 작은 지연이 있고 primary 장애 시 커밋된 트랜잭션이 복제되지 않았을 수 있다고 한다. 동기 복제는 `synchronous_standby_names`를 비어 있지 않게 설정하면 켜지고 `synchronous_commit`은 기본값 `on`이면 되며, 최소 대기 시간은 primary와 standby 사이 왕복 시간이고, 읽기 전용 트랜잭션과 롤백은 기다리지 않는다고 한다. `remote_write`는 standby OS까지, `remote_apply`는 재생까지 기다린다. 지연은 `pg_stat_replication`과 `pg_current_wal_lsn`/`pg_last_wal_receive_lsn` 비교로 볼 수 있다. MySQL 8.4 replication-implementation 페이지는 소스의 바이너리 로그를 레플리카가 요청해 가져와 실행하는 방식이라고 한다.
(실험 확인) 이 PostgreSQL 16.15 컨테이너는 단일 인스턴스(`wal_level = replica`, `max_wal_senders = 10`)이고 `pg_stat_replication`이 0행이었다. 위 모범 답변의 SQL은 오류 없이 실행되었지만 standby를 띄우지 않았으므로 복제 동작 자체는 실행해 확인하지 못했고, 위 내용은 문서 근거만이다.
