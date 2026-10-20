---
slug: "dbd-09"
topic: "db-design"
tier: DEEP
difficulty: 2
title: "PostgreSQL 선언적 파티셔닝의 range, list, hash는 각각 언제 쓰고 행은 어떻게 라우팅되나요?"
keywords: ["range는 하한 포함 상한 제외", "list는 값을 직접 나열", "hash는 modulus와 remainder", "DEFAULT 파티션", "키 갱신 시 행 이동"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/ddl-partitioning.html", "https://www.postgresql.org/docs/16/sql-createtable.html", "https://dev.mysql.com/doc/refman/8.4/en/partitioning-types.html"]
concepts: [db-scaling]
importance: 2
links: [{to: "dbd-10", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
range는 키 범위로 나누는 방식이라 날짜별 로그처럼 오래된 데이터를 통째로 떼어 낼 때 쓰고, list는 지역처럼 값을 직접 나열해 나누며, hash는 modulus와 remainder로 고르게 분산할 때 씁니다. range의 경계는 하한은 포함하고 상한은 제외합니다. 부모 테이블에 넣은 행은 파티션 키에 따라 해당 파티션으로 자동 라우팅되고, 맞는 파티션이 없으면 오류가 나지만 DEFAULT 파티션이 있으면 거기로 들어갑니다. 파티션 키 값을 UPDATE하면 행이 다른 파티션으로 이동합니다. 부모 테이블은 저장소가 없는 가상 테이블이고 데이터는 각 파티션에 있습니다.

```sql
CREATE TABLE logs(id bigint GENERATED ALWAYS AS IDENTITY, created_at timestamptz NOT NULL, msg text)
  PARTITION BY RANGE (created_at);
CREATE TABLE logs_2026_10 PARTITION OF logs
  FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE logs_default PARTITION OF logs DEFAULT;
```

(공식 문서) PostgreSQL 16 ddl-partitioning 페이지는 range(하한 포함, 상한 제외), list(값 나열), hash(modulus와 remainder)를 지원하고, 파티션 테이블 자체는 저장소가 없는 가상 테이블이며 행이 파티션 키에 따라 라우팅되고, 파티션 키를 갱신하면 경계를 벗어난 행은 다른 파티션으로 이동한다고 한다. sql-createtable 페이지는 맞는 파티션이 없는 행을 넣으면 오류가 나고, 어느 파티션에도 맞지 않는 키 값은 DEFAULT 파티션이 있으면 거기로 라우팅된다고 한다. MySQL 8.4 partitioning-types 페이지는 RANGE, LIST, HASH(LINEAR HASH 포함) 파티셔닝을 설명한다.
(실험 확인) PostgreSQL 16.15에서 9월/10월 파티션만 있는 `logs`에 12월 행을 넣으면 `no partition of relation "logs" found for row` 오류가 났고, DEFAULT 파티션을 만든 뒤에는 `logs_default`로 들어갔다. 9월 파티션의 행의 `created_at`을 10월로 UPDATE하자 `tableoid` 기준으로 `logs_2026_10`으로 옮겨졌다. 범위 경계값 `2026-10-01 00:00:00+00`은 10월 파티션(하한 포함)으로 들어갔다. 1000행을 `HASH (id)` modulus 2로 넣자 535행/465행으로 나뉘어 완전히 같지는 않았다. list 파티션에 없는 값('US')은 같은 종류의 오류였다. MySQL 쪽 라우팅 동작은 이번에 실행하지 않았다.
(보충) 어느 방식을 고를지(날짜 → range, 지역 → list, 고른 분산 → hash)는 문서의 설명을 바탕으로 한 일반적인 선택 기준이다.
