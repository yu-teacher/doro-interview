---
slug: "dbd-13"
topic: "db-design"
tier: DEEP
difficulty: 3
title: "PostgreSQL의 논리 복제는 물리 복제와 어떻게 다르고, 어떤 제약이 있나요?"
keywords: ["publication과 subscription", "행 변경 단위 복제", "wal_level logical", "DDL 미복제", "시퀀스 미복제"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/logical-replication.html", "https://www.postgresql.org/docs/16/logical-replication-restrictions.html", "https://www.postgresql.org/docs/16/logical-replication-config.html", "https://www.postgresql.org/docs/16/logical-replication-publication.html"]
concepts: [db-scaling]
importance: 1
links: [{to: "dbd-19", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
물리 복제는 WAL 블록 변경을 그대로 재생해 클러스터 전체를 복제하지만, 논리 복제는 publication으로 고른 테이블의 행 변경을 subscription이 구독해 적용합니다. 그래서 일부 테이블만, 다른 메이저 버전 사이에서도 복제할 수 있고 구독 쪽에서 쓰기나 트리거도 쓸 수 있습니다. 제약도 분명합니다. publisher에서 wal_level을 logical로 해야 하고, DDL과 시퀀스 값, large object는 복제되지 않으며, UPDATE와 DELETE를 복제하려면 기본키 같은 replica identity가 있어야 합니다. 스키마는 직접 맞춰야 하고, 페일오버를 하면 시퀀스를 따로 맞춰 줘야 합니다.

```sql
-- publisher
CREATE PUBLICATION pub_orders FOR TABLE orders;
-- subscriber (스키마는 미리 같게 만들어 둔다)
CREATE SUBSCRIPTION sub_orders CONNECTION '...' PUBLICATION pub_orders;
```

(공식 문서) PostgreSQL 16 logical-replication 페이지는 복제 아이덴티티(보통 기본키)에 기반해 데이터 변경을 복제하는 publish/subscribe 모델이며, 처음에는 스냅샷을 복사한 뒤 변경을 실시간으로 보내고, 다른 메이저 버전 간 복제와 일부 데이터만 복제하는 용도를 든다. logical-replication-restrictions 페이지는 DDL과 스키마가 복제되지 않고, 시퀀스 데이터와 large object도 복제되지 않으며, 뷰 등은 복제할 수 없다고 한다. logical-replication-config 페이지는 publisher의 `wal_level`을 `logical`로 해야 한다고 한다. logical-replication-publication 페이지는 UPDATE/DELETE 복제에는 replica identity가 필요하다고 한다.
(실험 확인) 이 컨테이너(PostgreSQL 16.15)는 `wal_level = replica`라서 `CREATE PUBLICATION`은 성공했지만 "wal_level is insufficient to publish logical changes" 경고가 나왔다. 실제 구독과 복제는 설정을 바꿀 수 없어 실행하지 않았다.
(보충) 물리 복제를 재해 복구용, 논리 복제를 무중단 업그레이드나 일부 테이블 이관용으로 쓴다는 구분은 일반적인 활용 사례 설명이다.
