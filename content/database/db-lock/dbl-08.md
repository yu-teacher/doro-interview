---
slug: "dbl-08"
topic: "db-lock"
tier: DEEP
difficulty: 2
title: "PostgreSQL의 행 락 모드(FOR UPDATE, NO KEY UPDATE, SHARE, KEY SHARE)는 어떻게 다른가요?"
keywords: ["FOR UPDATE", "FOR NO KEY UPDATE", "FOR SHARE", "FOR KEY SHARE", "충돌 행렬"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/explicit-locking.html", "https://www.postgresql.org/docs/16/sql-select.html"]
concepts: [db-locking]
importance: 1
---
**모범 답변 (30~60초)**
PostgreSQL 16의 행 락은 강한 순서로 FOR UPDATE, FOR NO KEY UPDATE, FOR SHARE, FOR KEY SHARE 네 가지입니다. FOR UPDATE는 가장 강해서 같은 행에 다른 네 모드를 전부 막고 DELETE와 키 컬럼을 바꾸는 UPDATE가 이 모드를 씁니다. FOR NO KEY UPDATE는 약간 약해서 FOR KEY SHARE는 막지 않으며 키가 아닌 컬럼만 바꾸는 일반 UPDATE가 이 모드입니다. FOR SHARE는 공유 락이라 FOR SHARE끼리는 공존하지만 수정은 막고, FOR KEY SHARE는 가장 약해서 DELETE나 키 변경만 막습니다. 락이 약할수록 같은 행을 동시에 다루는 트랜잭션이 늘어납니다.

(공식 문서) explicit-locking 13.3.2절은 네 모드와 충돌표(Table 13.3)를 싣는다. FOR UPDATE는 `DELETE`와, 외래 키에 쓸 수 있는 유니크 인덱스 컬럼(부분·표현식 인덱스 제외)을 바꾸는 `UPDATE`가 자동으로 잡고, FOR NO KEY UPDATE는 그 외 `UPDATE`가 잡는다. 행 락은 디스크에 기록되기 때문에 잠근 행 수 제한은 없지만 `SELECT FOR UPDATE`가 디스크 쓰기를 일으킬 수 있다.
(실험 확인) PostgreSQL 16.15에서 한 세션이 모드를 잡은 동안 다른 세션이 각 모드를 `NOWAIT`로 요청한 결과다.

| 보유 \ 요청 | KEY SHARE | SHARE | NO KEY UPDATE | UPDATE |
|---|---|---|---|---|
| KEY SHARE | 허용 | 허용 | 허용 | 대기 |
| SHARE | 허용 | 허용 | 대기 | 대기 |
| NO KEY UPDATE | 허용 | 대기 | 대기 | 대기 |
| UPDATE | 대기 | 대기 | 대기 | 대기 |

KEY SHARE를 쥔 동안 키가 아닌 컬럼의 UPDATE는 통과했고(`balance` 변경), 키 컬럼 변경(`id = id + 100`)과 `DELETE`는 대기했다. 반면 SHARE, NO KEY UPDATE, UPDATE를 쥔 동안에는 키 아닌 컬럼 UPDATE도 대기했다.
외래 키 관련 관찰: 자식 테이블 INSERT를 커밋하지 않은 동안 부모 행의 키 아닌 컬럼 UPDATE는 PostgreSQL에서 통과했고 부모 DELETE는 대기했다. MySQL 8.4.11(InnoDB)에서는 같은 상황에서 부모 행의 UPDATE가 `ERROR 1205`로 대기했다. MySQL 매뉴얼(innodb-locks-set)은 외래 키 검사가 확인하는 레코드에 공유 레코드 락을 건다고 쓴다.
(보충) PostgreSQL 쪽 차이의 원인이 외래 키 검사가 부모 행에 가장 약한 행 락을 잡기 때문일 것이라는 설명은 이번에 읽은 문서에서 확인하지 못했고, 위 관찰 결과만 실험으로 확인했다.
