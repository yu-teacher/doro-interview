---
slug: "dbd-16"
topic: "db-design"
tier: DEEP
difficulty: 2
title: "운영 중인 테이블에 인덱스를 만들 때 CREATE INDEX CONCURRENTLY를 왜 쓰고, 어떤 주의점이 있나요?"
keywords: ["일반 CREATE INDEX는 쓰기 차단", "CONCURRENTLY는 쓰기 허용", "테이블 두 번 스캔", "트랜잭션 블록 안 불가", "실패 시 INVALID 인덱스"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/sql-createindex.html"]
---
**모범 답변 (30~60초)**
일반 CREATE INDEX는 인덱스를 만드는 동안 해당 테이블의 쓰기를 막고 읽기만 허용합니다. CONCURRENTLY를 붙이면 쓰기를 막지 않고 만들 수 있지만 테이블을 두 번 스캔하고 기존 트랜잭션이 끝나기를 기다려서 전체 작업은 더 오래 걸립니다. 주의점이 몇 가지 있는데, 트랜잭션 블록 안에서는 실행할 수 없고, 도중에 실패하면 INVALID 상태의 인덱스가 남아 조회에는 안 쓰이면서 갱신 부담만 주므로 지우고 다시 만들어야 합니다. 유니크 인덱스는 빌드가 실패해도 다른 트랜잭션에는 유일성 검사가 먼저 적용될 수 있고, 한 테이블에서 동시에 하나만 만들 수 있습니다.

```sql
CREATE INDEX CONCURRENTLY ci_conc ON ci(v);
SELECT indexrelid::regclass, indisvalid FROM pg_index WHERE indrelid = 'ci'::regclass;
```

(공식 문서) sql-createindex 페이지는 표준 인덱스 빌드가 쓰기를 막고(읽기는 허용) `CONCURRENTLY`는 쓰기를 막지 않는다고 한다. 동시 빌드는 테이블을 두 번 스캔하고 기존 트랜잭션을 기다려 총 작업량이 많고 훨씬 오래 걸리며, 처음에 인덱스를 invalid로 등록한다고 한다. 도중에 문제(교착 상태, 유니크 위반)가 나면 invalid 인덱스가 남아 조회에는 무시되지만 갱신 오버헤드는 있고, 권장 복구는 지우고 다시 만들기이며, 유니크 인덱스를 동시에 만들 때는 두 번째 스캔이 시작되면 이미 다른 트랜잭션에 제약이 적용된다고 한다. 트랜잭션 블록 안에서는 CONCURRENTLY를 쓸 수 없고, 한 테이블에서 동시 빌드는 하나만 가능하다고 한다.
(실험 확인) PostgreSQL 16.15에서 200만 행(`text` 컬럼)에 일반 `CREATE INDEX`를 하는 약 1.6초 동안, 0.7초 뒤에 시작한 INSERT는 인덱스 완료 직후에야 끝났다(약 0.88초 걸림). `CREATE INDEX CONCURRENTLY`는 약 2.3초 걸렸고 그 사이 시작한 INSERT는 약 0.11초에 끝났다(인덱스 작업이 없을 때의 INSERT 기준선은 약 0.08초이며 둘 다 클라이언트 기동 시간을 포함한다). `psql -c`에 여러 문장을 한 번에 주면 한 트랜잭션이 되어 `CREATE INDEX CONCURRENTLY cannot run inside a transaction block` 오류가 났다. 유일성이 깨지는 표현식으로 유니크 인덱스를 동시에 만들자 실패했고 `pg_index.indisvalid = f`인 인덱스가 남았다. 이 시간은 이 데이터와 환경에서 나온 값이다.
