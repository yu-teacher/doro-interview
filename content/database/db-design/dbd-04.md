---
slug: "dbd-04"
topic: "db-design"
tier: BASIC
difficulty: 2
title: "소프트 삭제를 쓸 때 유일성 제약과 조회는 어떻게 설계하나요?"
keywords: ["deleted_at 컬럼", "부분 유니크 인덱스", "삭제 제외 조건", "일반 UNIQUE의 재가입 문제", "삭제 행 누적"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/indexes-partial.html"]
concepts: [schema-design, index-design]
importance: 2
links: [{to: "dbi-10", kind: RELATED}, {to: "dbs-18", kind: RELATED}]
---
**모범 답변 (30~60초)**
소프트 삭제는 행을 지우지 않고 deleted_at 같은 컬럼에 시각을 기록해 삭제 표시만 하는 방식입니다. 복구와 감사에는 편하지만 모든 조회에 삭제 제외 조건을 넣어야 하고 삭제 행이 계속 쌓입니다. 가장 흔한 함정은 유일성으로, 이메일에 일반 UNIQUE를 걸면 삭제된 계정 때문에 같은 이메일로 다시 가입할 수 없습니다. PostgreSQL 16에서는 `WHERE deleted_at IS NULL` 조건이 붙은 부분 유니크 인덱스로 살아 있는 행에만 유일성을 걸 수 있습니다. 이 인덱스를 조회에도 쓰려면 쿼리에 같은 조건이 있어야 합니다.

```sql
CREATE UNIQUE INDEX acct_email_live ON acct(email) WHERE deleted_at IS NULL;
```

(공식 문서) indexes-partial 페이지는 부분 인덱스가 조건(predicate)을 만족하는 행만 담으며, 이를 이용해 테이블의 일부 행에 대해서만 유일성을 강제하는 부분 유니크 인덱스를 만들 수 있다고 한다. 또 쿼리의 조건이 인덱스 조건과 맞아야 그 인덱스의 혜택을 받는다고 한다.
(실험 확인) PostgreSQL 16.15에서 부분 유니크 인덱스가 있을 때 살아 있는 같은 이메일을 한 번 더 넣으면 오류가 났고, `deleted_at`을 채워 삭제 표시한 뒤에는 같은 이메일을 다시 넣을 수 있었다. 일반 `UNIQUE(email)` 테이블은 삭제 표시 후 같은 이메일 INSERT가 오류였다. `enable_seqscan = off`로 둔 상태에서 `WHERE email = ... AND deleted_at IS NULL`은 부분 인덱스를 Index Scan으로 썼지만 `deleted_at` 조건이 없는 `WHERE email = ...`은 Seq Scan이었다. 부분 인덱스에 걸린 INSERT가 실패하는 경우에도 identity 번호가 소모되어 id가 1, 3으로 이어졌다.
(보충) 삭제 행이 쌓이는 문제의 대응(오래된 삭제 행을 아카이브하거나 파티셔닝으로 분리)과 소프트 삭제 대신 이력 테이블을 두는 방식은 일반적인 설계 선택지이며 문서가 권하는 것은 아니다.
