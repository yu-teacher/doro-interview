---
slug: "dbd-12"
topic: "db-design"
tier: DEEP
difficulty: 2
title: "읽기 부하를 replica로 분산할 때 복제 지연 때문에 생기는 문제와 대응은 무엇인가요?"
keywords: ["쓰고 바로 읽기 불일치", "읽기 라우팅", "remote_apply", "복구 충돌로 쿼리 취소", "hot_standby_feedback"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/warm-standby.html", "https://www.postgresql.org/docs/16/hot-standby.html"]
---
**모범 답변 (30~60초)**
복제가 비동기이면 쓰기 직후 replica에서 읽을 때 방금 쓴 데이터가 안 보일 수 있습니다. 그래서 쓴 직후의 읽기는 primary로 보내고 지연이 허용되는 조회만 replica로 보내는 식으로 라우팅합니다. PostgreSQL 16에서는 synchronous_commit을 remote_apply로 두면 standby가 재생을 마칠 때까지 커밋이 기다려서 인과 일관성을 얻을 수 있지만 쓰기 지연이 늘어납니다. 또 standby의 긴 쿼리는 primary의 vacuum 정리 같은 WAL 재생과 충돌해 취소될 수 있습니다. 대응으로 max_standby_streaming_delay를 늘려 재생을 더 미루거나(복제 지연이 커짐) hot_standby_feedback을 켤 수 있는데, 후자는 primary에 dead row가 쌓일 수 있습니다.

```sql
-- standby에서 지연과 충돌 취소 확인
SELECT pg_last_wal_receive_lsn(), pg_last_wal_replay_lsn(), pg_last_xact_replay_timestamp();
SELECT * FROM pg_stat_database_conflicts;
```

(공식 문서) hot-standby 페이지는 standby가 읽기 전용 쿼리를 받을 수 있고, primary의 ACCESS EXCLUSIVE 락과 DDL, vacuum 정리 레코드 적용 등이 standby 쿼리와 충돌할 수 있으며 충돌하면 standby는 WAL 재생을 미루거나 쿼리를 취소해야 하고, 충돌한 쿼리는 `max_standby_streaming_delay` 등을 넘기면 취소된다고 한다. `hot_standby_feedback`은 정리 충돌을 막지만 primary의 dead row 정리를 늦춰 테이블 비대화를 일으킬 수 있고, 충돌 취소 횟수는 `pg_stat_database_conflicts`로 본다고 한다. warm-standby 페이지는 `remote_apply`가 단순한 경우 인과 일관성을 가진 부하 분산을 가능하게 한다고 한다.
(실험 확인) 이 환경은 단일 인스턴스라 replica가 없어 복제 지연이나 충돌 취소는 실행해 확인하지 못했다(primary에서 위 함수와 뷰 조회 SQL이 오류 없이 도는 것만 확인).
(보충) 쓴 직후 읽기를 primary로 보내거나 세션을 고정하는 라우팅 방식은 문서에 있는 기능이 아니라 애플리케이션 설계에서 흔히 쓰는 일반 패턴이다.
