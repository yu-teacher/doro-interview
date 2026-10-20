---
slug: "dbd-19"
topic: "db-design"
tier: TRICKY
difficulty: 3
title: "논리 복제 대상 테이블에 기본키가 없으면 어떤 일이 생기나요?"
keywords: ["replica identity", "기본키가 기본값", "UPDATE와 DELETE 거절", "INSERT는 가능", "REPLICA IDENTITY FULL은 최후 수단"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/logical-replication-publication.html", "https://www.postgresql.org/docs/16/logical-replication.html"]
concepts: [db-scaling, schema-design]
importance: 1
---
**모범 답변 (30~60초)**
논리 복제는 구독 쪽에서 어떤 행을 고칠지 찾아야 해서, 발행하는 테이블에 replica identity가 있어야 UPDATE와 DELETE를 복제할 수 있습니다. 기본값은 기본키입니다. 기본키가 없는 테이블을 UPDATE와 DELETE를 발행하는 publication에 넣으면, PostgreSQL 16에서는 그 순간부터 원본 테이블에 대한 UPDATE와 DELETE 자체가 오류로 거절됩니다. INSERT는 계속 됩니다. 해결은 기본키나 적절한 유니크 인덱스를 replica identity로 쓰는 것이고, 정말 방법이 없을 때만 REPLICA IDENTITY FULL로 행 전체를 키로 쓰는데 구독 쪽 검색이 매우 비효율적일 수 있어 최후 수단입니다.

```sql
CREATE PUBLICATION pub_nopk FOR TABLE nopk;
UPDATE nopk SET b = 'z';       -- 오류: no replica identity
ALTER TABLE nopk REPLICA IDENTITY FULL;
UPDATE nopk SET b = 'ok';      -- 성공
```

(공식 문서) PostgreSQL 16 logical-replication-publication 페이지는 발행 테이블이 UPDATE와 DELETE를 복제하려면 replica identity가 있어야 하고 기본은 기본키이며 다른 유니크 인덱스를 쓸 수도 있고, 적절한 키가 없으면 `REPLICA IDENTITY FULL`로 행 전체를 키로 쓸 수 있지만 구독 쪽 검색이 매우 비효율적일 수 있어 다른 방법이 없을 때의 대안으로만 써야 한다고 한다.
(실험 확인) 이 컨테이너(PostgreSQL 16.15, `wal_level = replica`)에서 기본키 없는 `nopk` 테이블은 publication을 만들기 전에는 UPDATE가 성공했다. `CREATE PUBLICATION pub_nopk FOR TABLE nopk` 뒤에는 UPDATE가 "cannot update table "nopk" because it does not have a replica identity and publishes updates"로, DELETE도 같은 형태의 오류로 거절되었다. `relreplident`는 `d`(기본)였고 `REPLICA IDENTITY FULL`로 바꾸자 UPDATE가 성공했다. 구독 쪽에서 실제로 복제를 받는 실험은 `wal_level` 때문에 하지 않았다.
