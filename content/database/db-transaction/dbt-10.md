---
slug: "dbt-10"
topic: "db-transaction"
tier: DEEP
difficulty: 2
title: "PostgreSQL에서 dead tuple은 왜 생기고 VACUUM은 무엇을 하나요?"
keywords: ["dead tuple", "VACUUM", "autovacuum", "VACUUM FULL", "재사용"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/routine-vacuuming.html", "https://www.postgresql.org/docs/16/mvcc-intro.html"]
concepts: [mvcc]
importance: 2
links: [{to: "dbt-13", kind: FOLLOWUP}, {to: "dbp-18", kind: RELATED}]
---
**모범 답변 (30~60초)**
PostgreSQL 16에서 UPDATE나 DELETE는 기존 행 버전을 바로 지우지 않고 남겨 둡니다. 다른 트랜잭션이 아직 그 버전을 볼 수 있기 때문입니다. 나중에 어떤 트랜잭션도 보지 않게 된 옛 버전이 dead tuple이고, VACUUM이 테이블과 인덱스에서 그 버전을 제거해 공간을 재사용할 수 있게 표시합니다. 일반 VACUUM은 보통 공간을 OS에 돌려주지 않고 같은 테이블이 재사용하게 하며, 파일을 새로 써서 줄이는 VACUUM FULL은 테이블에 ACCESS EXCLUSIVE 락이 필요합니다. 평소에는 autovacuum이 이를 대신 돌립니다.

(공식 문서) Routine Vacuuming 절은 UPDATE·DELETE가 MVCC 때문에 옛 행 버전을 즉시 지우지 않고, VACUUM이 쓸모없어진 버전을 제거해 공간을 새 행이 재사용하도록 한다고 설명한다. VACUUM의 목적으로 공간 회수, 플래너 통계 갱신, visibility map 갱신, XID wraparound 방지를 든다. 표준 VACUUM은 운영 중 병행 실행이 가능하고 공간을 OS에 돌려주지 않지만(끝 페이지가 비는 경우 예외), VACUUM FULL은 더 많이 회수하는 대신 느리고 ACCESS EXCLUSIVE 락이 필요하며 autovacuum은 VACUUM FULL을 쓰지 않는다고 한다.
(실험 확인) PostgreSQL 16.15에서 autovacuum을 끈 테이블(`WITH (autovacuum_enabled=false)`, 1000행)을 두 번 UPDATE하자 `pg_stat_user_tables`의 `n_dead_tup`이 2000으로 보였고 `pg_relation_size`는 40kB에서 104kB로 늘었다. 일반 VACUUM 뒤 `n_dead_tup`은 0이 됐지만 크기는 104kB 그대로였고, 다시 UPDATE해도 104kB로 늘지 않았다. 이 데이터와 설정에서 나온 값이며 통계 수치는 환경에 따라 다르다.
