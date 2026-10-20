---
slug: "dbp-14"
topic: "db-tuning"
tier: DEEP
difficulty: 2
title: "대량 데이터를 넣을 때 INSERT 반복보다 COPY가 좋은 이유와 그 밖의 적재 요령은 무엇인가요?"
keywords: ["한 트랜잭션으로 묶기", "COPY 오버헤드 적음", "다중 행 INSERT", "인덱스·외래 키 나중에 생성", "적재 후 ANALYZE"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/populate.html", "https://www.postgresql.org/docs/16/sql-copy.html", "https://dev.mysql.com/doc/refman/8.4/en/optimizing-innodb-bulk-data-loading.html", "https://dev.mysql.com/doc/refman/8.4/en/insert-optimization.html"]
---
**모범 답변 (30~60초)**
행마다 INSERT를 자동 커밋으로 보내면 문장마다 파싱과 네트워크 왕복, 커밋 처리가 반복됩니다. PostgreSQL 16 기준으로 일단 한 트랜잭션으로 묶고, 여러 행을 한 INSERT에 담고, 가장 효율적으로는 COPY로 한 번에 적재하는 게 좋습니다. 공식 문서는 COPY가 INSERT보다 오버헤드가 훨씬 적고 PREPARE와 배치를 써도 COPY가 거의 항상 빠르다고 합니다. 큰 적재에서는 인덱스와 외래 키를 지웠다가 적재 뒤에 다시 만들고, 끝나면 ANALYZE를 돌리라고 합니다. MySQL 8.4(InnoDB)에서는 자동 커밋을 끄고 다중 행 INSERT나 LOAD DATA를 쓰는 것이 같은 맥락입니다.

```sql
COPY ld FROM STDIN;                      -- PostgreSQL
LOAD DATA LOCAL INFILE '/tmp/ld.tsv' INTO TABLE ld;   -- MySQL
```

(공식 문서) PostgreSQL Populating a Database는 자동 커밋을 끄고 마지막에 한 번 커밋하라고 하고, COPY는 단일 명령이라 자동 커밋 문제가 없으며 INSERT보다 오버헤드가 크게 적다고 한다. 새로 만든 테이블에는 COPY 후 인덱스를 만들고, 기존 테이블에 대량 추가할 때는 인덱스·외래 키 제거 후 재생성이 이득일 수 있으며, 외래 키가 있으면 보류 트리거 큐가 메모리를 넘칠 수 있다고 한다. maintenance_work_mem과 max_wal_size를 일시적으로 올리면 도움이 되고 적재 뒤 ANALYZE를 강하게 권한다. MySQL 8.4 InnoDB 대량 적재 문서는 자동 커밋이 INSERT마다 로그 플러시를 하므로 끄라고 하고, 다중 행 INSERT로 통신 오버헤드를 줄이며 기본 키 순서로 넣으라고 하고, unique_checks·foreign_key_checks를 잠시 끄는 방법도 알려 준다. Optimizing INSERT Statements 페이지는 다중 VALUES INSERT가 단건 INSERT보다 훨씬 빠르고 LOAD DATA는 보통 INSERT보다 약 20배 빠르다고 한다.
(실험 확인) 컨테이너 안 psql/mysql 클라이언트 하나로 PK가 있는 테이블에 20,000행을 넣은 시간이다(프로세스 시작 시간 포함, PostgreSQL과 MySQL 모두 두 번 반복해 비슷했다). PostgreSQL 16.15는 자동 커밋 INSERT 2.2~2.4초, 한 트랜잭션 INSERT 0.8~0.9초, 1,000행씩 다중 행 INSERT 0.09~0.11초, COPY 0.08초였다. MySQL 8.4.11(innodb_flush_log_at_trx_commit=1)은 자동 커밋 12.6~13.1초, 한 트랜잭션 0.75~1.0초, 다중 행 0.13~0.15초, LOAD DATA LOCAL 0.12~0.14초였다. 이 값은 로컬 소켓과 이 설정에서의 값이다.
(보충) PostgreSQL에서 여러 행을 한 INSERT에 담으라는 권고는 읽은 PostgreSQL 16 문서(Populating a Database)에서 직접 서술한 문장을 찾지 못했고(MySQL 문서에는 있다) 위 실험(다중 행 0.09초)에 근거한 설명이다. 자동 커밋 INSERT가 문장마다 네트워크 왕복을 반복한다는 점도 위 문서에는 없는 일반적 설명이며, 이 실험은 같은 컨테이너 안의 로컬 소켓이라 왕복 지연이 작게 나온다.
