---
slug: "dbd-14"
topic: "db-design"
tier: DEEP
difficulty: 3
title: "PostgreSQL의 pg_dump 같은 논리 백업과 물리 백업, PITR은 어떻게 다른가요?"
keywords: ["pg_dump 논리 스냅샷", "베이스 백업과 WAL 아카이브", "특정 시점 복구", "archive_command", "클러스터 전체 단위 복원"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/backup-dump.html", "https://www.postgresql.org/docs/16/continuous-archiving.html", "https://www.postgresql.org/docs/16/app-pgbasebackup.html"]
---
**모범 답변 (30~60초)**
pg_dump는 SQL이나 아카이브 형태로 데이터베이스를 논리적으로 덤프하는 방식으로, 시작 시점의 일관된 스냅샷을 만들고 일부 테이블만 복원할 수도 있지만 복원 시점을 고를 수는 없습니다. PITR은 파일 수준 베이스 백업에 더해 그 이후의 WAL 파일을 계속 아카이브해 두었다가, 원하는 시점까지 WAL을 재생해 복구하는 방식입니다. 이를 위해 archive_mode와 archive_command를 설정해야 하고, 복구는 클러스터 전체 단위로만 됩니다. 실수로 테이블을 지운 직전 시점으로 돌리는 용도에 맞지만, 베이스 백업 주기와 WAL 보관 용량을 함께 계획해야 합니다.

```bash
pg_dump -Fc -d mydb -f mydb.dump        # 논리 백업
pg_basebackup -D /backup -X stream      # 베이스 백업(PITR의 출발점)
```

(공식 문서) PostgreSQL 16 backup-dump 페이지는 pg_dump가 시작 시점의 내부적으로 일관된 스냅샷을 만들고 다른 작업을 막지 않지만(대부분의 ALTER TABLE 같은 배타 락 작업은 예외), 서로 다른 데이터베이스의 스냅샷은 pg_dumpall에서 동기화되지 않는다고 한다. continuous-archiving 페이지는 PITR이 베이스 백업과 연속된 WAL 아카이브로 이루어지고 베이스 백업 이후 임의 시점으로 복구할 수 있으며, pg_dump 덤프는 논리적이라 WAL 재생에 쓸 수 없고, 이 방식은 클러스터 전체만 복원할 수 있으며 아카이브 용량이 많이 든다고 한다. 아카이빙은 `wal_level`을 replica 이상, `archive_mode`와 `archive_command`(또는 `archive_library`)로 켠다고 한다. app-pgbasebackup 페이지는 pg_basebackup이 클러스터 파일의 정확한 복사본을 만들며 백업은 항상 데이터베이스 클러스터 전체 단위이고 PITR의 출발점으로 쓸 수 있다고 하고, `-X stream`이 기본이라고 한다.
(실험 확인) PostgreSQL 16.15에서 `pg_dump -Fc -t bk`로 만든 덤프를 `pg_restore`로 별도 데이터베이스에 복원하자 5행이 그대로 복원되었다. 이 컨테이너는 `archive_mode = off`, `archive_command = (disabled)`라 WAL 아카이브와 시점 복구 자체는 실행하지 않았다. `pg_basebackup`은 문서대로 클러스터 전체를 읽어 다른 데이터베이스까지 건드리게 되므로 이 검증에서는 실행하지 않았다.
(보충) pg_dump로는 덤프 시작 시점으로만 복원된다는 점은 시작 시점 스냅샷이라는 문서 설명에서 도출한 것이고, 실수로 테이블을 지운 직전으로 되돌리는 용도에 PITR이 맞는다는 것은 일반적인 활용 설명이다. 백업 주기, 보관 정책, 복구 훈련을 해야 한다는 점도 일반적인 운영 지침이다.
