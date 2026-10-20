---
slug: "dbt-11"
topic: "db-transaction"
tier: DEEP
difficulty: 3
title: "PostgreSQL의 트랜잭션 ID와 xmin·xmax는 무엇이고 행 가시성을 어떻게 결정하나요?"
keywords: ["xmin", "xmax", "새 버전", "처음 쓸 때 배정", "스냅샷", "32비트"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/ddl-system-columns.html", "https://www.postgresql.org/docs/16/transaction-id.html", "https://www.postgresql.org/docs/16/functions-info.html", "https://www.postgresql.org/docs/16/routine-vacuuming.html"]
---
**모범 답변 (30~60초)**
PostgreSQL 16의 모든 행 버전에는 시스템 컬럼 xmin과 xmax가 있습니다. xmin은 그 버전을 만든 트랜잭션 ID이고, xmax는 지우거나 갱신한 트랜잭션 ID이며 아직 안 지워졌으면 0입니다. UPDATE는 옛 버전의 xmax를 채우고 새 버전을 만듭니다. 트랜잭션 ID는 읽기만 하면 배정되지 않고 처음 쓸 때 배정되며, 스냅샷은 어느 트랜잭션이 진행 중이었는지를 담고 있어서 어떤 ID의 트랜잭션이 스냅샷 시점에 끝났는지로 그 버전이 보이는지 판단합니다. XID는 32비트라 wraparound를 막으려고 VACUUM이 오래된 행을 freeze합니다.

(공식 문서) 시스템 컬럼 문서는 xmin이 해당 행 버전을 삽입한 트랜잭션 ID, xmax가 삭제한 트랜잭션 ID(삭제되지 않았으면 0)이고, 보이는 버전에서도 삭제 트랜잭션이 아직 커밋되지 않았거나 롤백된 경우 xmax가 0이 아닐 수 있다고 한다. Transactions and Identifiers 절은 XID가 트랜잭션이 처음 데이터베이스에 쓸 때 배정되고, 32비트라 약 40억 트랜잭션마다 wraparound되며, 64비트 `xid8`이 따로 있다고 한다. 함수 문서의 `pg_visible_in_snapshot`은 주어진 ID가 스냅샷 이전에 끝났는지를 돌려준다. Routine Vacuuming 절은 wraparound를 막으려고 VACUUM이 충분히 오래된 행을 freeze하고, 모든 테이블을 약 20억 트랜잭션 안에 vacuum해야 한다고 한다.
(실험 확인) PostgreSQL 16.15에서 한 행이 `xmin=41769, ctid=(0,1)`이었고, BEGIN 직후 `pg_current_xact_id_if_assigned()`는 NULL이었다. 읽기만 한 뒤에도 NULL이었고, UPDATE 뒤에는 ID 41770이 배정됐으며 같은 행이 `xmin=41770, ctid=(0,2)`로 보였다. `pageinspect` 확장으로 힙 페이지를 보면 옛 버전이 `t_xmin=41769, t_xmax=41770, t_ctid=(0,2)`로 남아 있었다(ID 값은 이 실행의 값이다). 문서는 xmax를 '삭제한 트랜잭션'으로만 정의하므로 UPDATE가 옛 버전의 xmax를 채운다는 부분은 이 실험으로 확인한 것이다.
(보충) 'xmin·xmax를 스냅샷과 대조해 그 행 버전이 보이는지 판단한다'는 연결은 위 문서들이 한 문장으로 설명한 것이 아니라 각 항목(xmin·xmax 정의, 스냅샷 함수)을 이어 붙인 일반 설명이다. 가시성 판단의 세부 규칙(커밋 상태 조회, hint bit 등)은 이번에 읽은 문서에 없어 다루지 않았다.
