---
slug: "dbs-02"
topic: "db-basics"
tier: BASIC
difficulty: 1
title: "외래키(FOREIGN KEY)는 무엇을 보장하고, 부모 행을 삭제할 때 옵션은 어떻게 다른가요?"
keywords: ["참조 무결성", "부모는 기본키 또는 유니크", "RESTRICT와 NO ACTION", "ON DELETE CASCADE", "참조 컬럼 인덱스"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/ddl-constraints.html"]
concepts: [schema-design]
importance: 3
links: [{to: "dbs-01", kind: PREREQ}, {to: "dbi-06", kind: RELATED}]
---
**모범 답변 (30~60초)**
외래키는 자식 테이블의 값이 부모 테이블에 실제로 있는 값이거나 NULL임을 보장하는 참조 무결성 제약입니다. 참조 대상은 기본키이거나 유니크 제약이 걸린 컬럼이어야 합니다. 부모 행을 지울 때의 동작은 ON DELETE로 정하는데, PostgreSQL 16 기준 기본값인 NO ACTION은 자식이 남아 있으면 오류를 내고, RESTRICT도 막지만 NO ACTION만 검사를 트랜잭션 끝으로 미룰 수 있습니다(DEFERRABLE로 선언한 경우). CASCADE는 자식 행도 함께 지우고, SET NULL과 SET DEFAULT도 있습니다. 부모 삭제 때 자식 테이블을 찾아봐야 하므로 참조하는 컬럼에 인덱스를 두는 것이 좋습니다.

```sql
CREATE TABLE order_items(
  product_no int REFERENCES products ON DELETE RESTRICT,
  order_id   int REFERENCES orders   ON DELETE CASCADE,
  qty        int,
  PRIMARY KEY (product_no, order_id)
);
```

(공식 문서) PostgreSQL 16 ddl-constraints 페이지는 외래키가 참조 무결성을 유지하며, 참조되는 컬럼은 기본키이거나 유니크 제약(또는 부분 아닌 유니크 인덱스)이어야 하고, NO ACTION이 기본이며 RESTRICT와의 차이는 검사를 미룰 수 있는지라고 설명한다. 부모 DELETE나 UPDATE가 자식 테이블 스캔을 요구하므로 참조하는 컬럼에도 인덱스를 두는 것이 좋다는 안내도 있다. 참조하는 컬럼 중 하나라도 NULL이면 기본적으로 제약을 만족할 필요가 없다는 설명도 있다.
(실험 확인) PostgreSQL 16.15에서 부모에 없는 `product_no = 99`를 넣으면 외래키 위반 오류, 자식이 남은 상품을 지우면 RESTRICT 오류가 났고, 주문을 지우자 ON DELETE CASCADE로 그 주문의 `order_items` 행이 함께 지워졌다. `DEFERRABLE INITIALLY DEFERRED`로 선언한 NO ACTION 외래키는 한 트랜잭션에서 부모 행을 지웠다가 같은 값으로 다시 넣고 COMMIT하면 통과했고, 같은 선언의 RESTRICT는 DELETE 시점에 바로 오류가 났다. 유니크 제약이 없는 컬럼을 참조하는 외래키는 `there is no unique constraint matching given keys for referenced table` 오류였다. MySQL 8.4.11(InnoDB)에서도 같은 구성이 같은 결과였다(오류 1452, 1451, CASCADE 삭제).
