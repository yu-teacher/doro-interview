---
slug: "dbl-11"
topic: "db-lock"
tier: DEEP
difficulty: 2
title: "데드락을 줄이는 방법과, 데드락이 났을 때 애플리케이션은 어떻게 처리해야 하나요?"
keywords: ["일관된 락 순서", "처음부터 가장 강한 락", "40P01 재시도", "트랜잭션을 짧게"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/explicit-locking.html", "https://www.postgresql.org/docs/16/errcodes-appendix.html", "https://dev.mysql.com/doc/refman/8.4/en/innodb-deadlocks-handling.html"]
---
**모범 답변 (30~60초)**
가장 효과적인 방어는 여러 행이나 테이블을 잠글 때 모든 트랜잭션이 같은 순서로 잡게 하는 것입니다. 예를 들어 항상 id 오름차순으로 갱신하면 서로 반대로 기다리는 순환이 생기지 않습니다. PostgreSQL 16 문서는 또 한 객체에 처음 잡는 락을 이후 필요한 가장 강한 모드로 잡으라고 권합니다. 트랜잭션을 짧게 유지하고 락을 쥔 채 사용자 입력을 기다리지 않아야 합니다. 그래도 완전히 없앨 수는 없어서, 데드락 오류(PostgreSQL은 40P01, MySQL은 1213)를 받으면 트랜잭션 전체를 처음부터 다시 실행하는 재시도 로직을 둡니다. MySQL 8.4 InnoDB 문서는 적절한 인덱스로 잠기는 범위를 줄이고 가능하면 READ COMMITTED를 고려하라고 합니다.

(공식 문서) PostgreSQL explicit-locking 13.3.4절: 데드락을 피하는 최선은 여러 객체에 락을 일관된 순서로 잡는 것이고, 객체에 처음 잡는 락은 필요한 가장 제한적인 모드여야 하며, 미리 보장할 수 없으면 데드락으로 중단된 트랜잭션을 재시도하는 방식으로 대응한다. 락을 기다리면 데드락이 감지되지 않는 한 무한정 기다리므로 사용자 입력을 기다리며 트랜잭션을 길게 열어 두는 것은 좋지 않다고 한다. errcodes-appendix: 40P01은 deadlock_detected다. MySQL 8.4 innodb-deadlocks-handling: 데드락은 위험하지 않으며 다시 시도하면 된다, 트랜잭션을 작고 짧게 유지한다, 일관된 순서로 작업한다, 인덱스를 추가해 스캔·락 범위를 줄인다, 잠금 읽기를 쓰면 READ COMMITTED 같은 낮은 격리 수준을 시도한다, 필요하면 `innodb_print_all_deadlocks`로 모든 데드락을 에러 로그에 남긴다. 다만 같은 매뉴얼의 innodb-deadlocks는 격리 수준이 데드락 가능성 자체를 바꾸지는 않는다고도 쓴다(격리 수준은 읽기 동작을 바꾸고 데드락은 쓰기에서 생긴다는 설명).
(실험 확인) PostgreSQL 16.15에서 데드락이 나는 시나리오(서로 반대 순서)의 두 세션을 모두 id=1, id=2 순서로 UPDATE하게 바꾸자 데드락 없이 두 번째 세션이 첫 번째 커밋을 기다렸다가 둘 다 완료됐고 두 행 모두 +2가 반영됐다. `WHERE id IN (...) ORDER BY id FOR UPDATE`로 먼저 잠근 두 세션도(한쪽은 `IN (2,1)`로 적음) 데드락 없이 차례로 끝나 두 행 모두 +2가 됐다. MySQL의 1213 오류는 dbl-05 실험에서 확인했다.
(보충) `SELECT ... WHERE id IN (...) ORDER BY id FOR UPDATE`처럼 정렬한 뒤 잠그는 방식으로 락 순서를 맞추는 방법은 sql-select 문서가 ORDER BY가 먼저 적용된다고 설명하는 데서 이끌어 낸 일반적인 관용구이며, 문서가 이 방법을 권한 것은 아니다. READ COMMITTED에서 이 쿼리가 대기 뒤 순서가 어긋날 수 있다는 점은 dbl-18에서 다룬다.
