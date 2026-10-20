---
slug: "dbt-04"
topic: "db-transaction"
tier: BASIC
difficulty: 1
title: "autocommit이란 무엇이고 PostgreSQL과 MySQL에서 어떻게 다른가요?"
keywords: ["암묵적인 BEGIN과 COMMIT", "명시적 트랜잭션", "AUTOCOMMIT 변수", "autocommit이 기본으로 켜져", "커밋 없이 세션이 끝나면 롤백"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/tutorial-transactions.html", "https://www.postgresql.org/docs/16/app-psql.html", "https://dev.mysql.com/doc/refman/8.4/en/innodb-autocommit-commit-rollback.html"]
---
**모범 답변 (30~60초)**
autocommit은 문장 하나가 끝날 때마다 자동으로 커밋되는 모드입니다. PostgreSQL 16에서는 BEGIN 없이 실행한 문장이 각각 암묵적인 BEGIN과 COMMIT으로 감싸진 단일 문장 트랜잭션이고, 여러 문장을 묶으려면 BEGIN이나 START TRANSACTION으로 명시적 트랜잭션을 엽니다. psql에는 AUTOCOMMIT 변수가 있어 끄면 psql이 암묵적으로 BEGIN을 넣어 줍니다. MySQL 8.4(InnoDB)에서는 연결마다 autocommit이 기본으로 켜져 있고, `SET autocommit = 0`으로 끄면 항상 트랜잭션이 열려 있으며 커밋 없이 세션이 끝나면 롤백됩니다.

(공식 문서) PostgreSQL 튜토리얼은 BEGIN이 없으면 각 문장이 암묵적 BEGIN과 성공 시 COMMIT으로 감싸지며, 일부 클라이언트 라이브러리는 BEGIN과 COMMIT을 자동으로 발행하니 해당 인터페이스 문서를 확인하라고 한다. psql 문서는 `AUTOCOMMIT`이 기본 on이고 off면 트랜잭션 블록 밖의 명령 앞에 암묵적 BEGIN을 넣으며, 실패한 트랜잭션은 직접 ROLLBACK해야 하고 커밋 없이 종료하면 작업이 사라진다고 한다. MySQL 문서(autocommit, Commit, and Rollback 절)는 InnoDB의 모든 사용자 활동이 트랜잭션 안에서 일어나고, 연결은 autocommit 켜짐으로 시작하며, 끄고 커밋 없이 끝나면 롤백한다고 설명한다.
(실험 확인) PostgreSQL 16.15에서 `\set AUTOCOMMIT off` 뒤 INSERT하고 커밋 없이 psql을 종료하자 다른 세션에서 0건이었다. 기본 설정에서는 INSERT 한 문장 직후 다른 세션에서 1건이 보였다. MySQL 8.4.11에서 `@@autocommit`은 1이었고, `SET autocommit=0` 뒤 INSERT하고 연결을 끊으면 0건이었다.
