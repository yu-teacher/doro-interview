---
slug: "dbp-18"
topic: "db-tuning"
tier: TRICKY
difficulty: 2
title: "DELETE로 행을 많이 지웠는데 테이블 크기가 줄지 않는 이유는 무엇이고, VACUUM과 VACUUM FULL은 무엇이 다른가요?"
keywords: ["행 버전 즉시 삭제 안 함", "재사용 가능으로 표시", "OS에 공간 미반환", "VACUUM FULL 재작성", "ACCESS EXCLUSIVE 락"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/routine-vacuuming.html", "https://www.postgresql.org/docs/16/sql-vacuum.html", "https://www.postgresql.org/docs/16/runtime-config-autovacuum.html"]
---
**모범 답변 (30~60초)**
PostgreSQL 16 기준으로 UPDATE나 DELETE는 기존 행 버전을 바로 지우지 않고 남겨 둡니다. 다른 트랜잭션이 아직 볼 수 있을 수 있기 때문입니다. 그 죽은 행 버전이 차지한 공간을 일반 VACUUM이 재사용 가능으로 표시하지만 운영체제에 돌려주지는 않는 게 보통이라서, 테이블 끝의 빈 페이지만 예외이고 DELETE 후에도 파일 크기는 그대로일 수 있습니다. 새 행은 그 공간을 재사용합니다. 크기를 실제로 줄이려면 VACUUM FULL로 테이블을 새 파일에 다시 써야 하는데, ACCESS EXCLUSIVE 락이 필요하고 추가 디스크 공간도 필요해서 운영 중에는 신중해야 합니다. 평소에는 autovacuum이 이 일을 합니다.

```sql
DELETE FROM bl WHERE id % 2 = 0;
VACUUM bl;                 -- 크기 그대로, 빈 공간은 재사용됨
VACUUM FULL bl;            -- 테이블 파일을 새로 써서 크기 감소 (ACCESS EXCLUSIVE)
SELECT pg_size_pretty(pg_table_size('bl'));
```

(공식 문서) Routine Vacuuming의 Recovering Disk Space 절은 UPDATE/DELETE가 MVCC 때문에 이전 행 버전을 바로 지우지 않으며, 표준 VACUUM은 죽은 행 버전의 공간을 재사용 가능하게 표시할 뿐 테이블 끝의 빈 페이지를 배타 락을 쉽게 얻을 수 있을 때만 OS에 반환한다고 한다. VACUUM FULL은 테이블의 새 버전을 통째로 써서 공간을 최소화하지만 느리고 ACCESS EXCLUSIVE 락과 새 복사본만큼의 디스크가 필요하며, autovacuum은 VACUUM FULL을 하지 않는다고 한다. 전체 내용을 주기적으로 지울 때는 DELETE 후 VACUUM 대신 TRUNCATE를 고려하라고 한다. autovacuum은 `autovacuum_vacuum_threshold(50) + autovacuum_vacuum_scale_factor(0.2) × 행 수`를 넘는 변경이 쌓이면 테이블을 vacuum한다.
(실험 확인) PostgreSQL 16.15(autovacuum을 끈 테이블 bl, 행 20만 개). 처음 27MB, 전체 UPDATE 후 54MB(n_dead_tup 200000), id > 100000을 DELETE하고 일반 VACUUM을 하자 40MB로 줄었다(테이블 뒤쪽 빈 페이지가 반환된 것으로 보인다). 그 뒤 10만 행 UPDATE에도 40MB로 유지되었고 VACUUM FULL 뒤 13MB가 되었다. 반대로 짝수 id를 골고루 지운 경우에는 일반 VACUUM 뒤에도 27MB 그대로였고, 10만 행을 추가해도 27MB(빈 공간 재사용)였다.
