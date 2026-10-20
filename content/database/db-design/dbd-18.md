---
slug: "dbd-18"
topic: "db-design"
tier: TRICKY
difficulty: 3
title: "파티션된 테이블에 기본키(유니크 제약)를 걸 때 왜 파티션 키를 포함해야 하나요?"
keywords: ["파티션 키 포함 필수", "파티션별 로컬 인덱스", "전역 유니크 불가", "id 단독 유일성 보장 안 됨", "MySQL도 같은 규칙"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/ddl-partitioning.html", "https://www.postgresql.org/docs/16/sql-createtable.html", "https://dev.mysql.com/doc/refman/8.4/en/partitioning-limitations-partitioning-keys-unique-keys.html", "https://dev.mysql.com/doc/refman/8.4/en/partitioning-limitations.html"]
---
**모범 답변 (30~60초)**
파티션 테이블의 유니크 인덱스는 실제로는 파티션마다 따로 있는 인덱스들의 모음이라, 각 인덱스는 자기 파티션 안의 중복만 검사할 수 있습니다. 그래서 PostgreSQL 16은 기본키나 유니크 제약의 컬럼에 파티션 키 컬럼이 모두 들어 있어야만 만들게 해 줍니다. 파티션 키가 제약에 들어 있으면 같은 값은 항상 같은 파티션에 들어가므로 파티션별 검사만으로 전체 유일성이 보장되기 때문입니다. 결과적으로 id 하나만으로는 기본키를 걸 수 없고 (id, created_at) 같은 복합키가 되며, id 단독 유일성은 DB가 보장하지 못합니다. MySQL 8.4(InnoDB)도 같은 규칙이고 파티션 테이블에서는 외래키를 지원하지 않습니다.

```sql
CREATE TABLE ev3(id bigint, created_at timestamptz NOT NULL, PRIMARY KEY (id, created_at))
  PARTITION BY RANGE (created_at);
-- PRIMARY KEY (id) 만으로는 만들 수 없다
```

(공식 문서) ddl-partitioning 페이지는 파티션 테이블에 유니크나 기본키를 만들려면 제약 컬럼이 파티션 키 컬럼을 모두 포함해야 하고, 각 파티션의 인덱스가 자기 파티션 안에서만 유일성을 강제할 수 있기 때문이며, 파티션 구조가 파티션 간 중복이 없음을 보장해야 한다고 한다. sql-createtable 페이지도 다단계 파티션에서는 모든 하위 파티션 키 컬럼을 제약에 넣어야 한다고 한다. MySQL 8.4 문서는 파티션 표현식에 쓰이는 모든 컬럼이 모든 유니크 키(기본키 포함)에 들어가야 한다고 하고, 파티션된 InnoDB 테이블은 외래키를 지원하지 않는다고 한다.
(실험 확인) PostgreSQL 16.15에서 `created_at` 기준 range 파티션 테이블에 `PRIMARY KEY (id)`는 "unique constraint on partitioned table must include all partitioning columns" 오류로 거절되었다. `PRIMARY KEY (id, created_at)`은 만들어졌고 서로 다른 두 파티션에 같은 `id = 1` 행이 모두 들어갔다. 이 복합키 테이블의 `id`만 참조하는 외래키는 "there is no unique constraint matching given keys" 오류였다. MySQL 8.4.11에서 `PRIMARY KEY (id)`는 오류 1503이었고 `(id, created_at)`은 만들어졌으며, 외래키가 있는 파티션 테이블은 오류 1506("Foreign keys are not yet supported in conjunction with partitioning")이었다.
(보충) 파티션 키가 제약에 들어 있으면 같은 키 값은 항상 같은 파티션에 들어가 파티션별 검사로 전체 유일성이 보장된다는 설명은 문서의 "파티션 구조가 중복 없음을 보장해야 한다"는 문장에서 도출한 해석이다.
