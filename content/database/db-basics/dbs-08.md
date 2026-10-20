---
slug: "dbs-08"
topic: "db-basics"
tier: DEEP
difficulty: 2
title: "정규화는 무엇이고 1NF, 2NF, 3NF는 각각 무엇을 없애나요?"
keywords: ["중복과 갱신 이상 제거", "1NF 원자값", "2NF 부분 함수 종속 제거", "3NF 이행 종속 제거", "반정규화 트레이드오프"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/ddl-constraints.html"]
concepts: [schema-design]
importance: 3
links: [{to: "dbd-01", kind: RELATED}]
---
**모범 답변 (30~60초)**
정규화는 한 사실을 한 곳에만 저장하도록 테이블을 나눠 중복과 그에 따른 갱신, 삽입, 삭제 이상을 줄이는 설계 과정입니다. 1NF는 컬럼이 더 쪼갤 수 없는 값 하나만 갖고 반복되는 컬럼 그룹이 없는 상태입니다. 2NF는 복합키일 때 키의 일부에만 종속된 컬럼을 분리한 상태이고, 3NF는 키가 아닌 컬럼이 다른 키가 아닌 컬럼에 종속되는 이행 종속까지 분리한 상태입니다. 예를 들어 주문 행마다 고객 도시를 적으면 한 곳만 고쳤을 때 값이 어긋나므로 고객 테이블로 뺍니다. 조회 성능 때문에 일부러 정규화를 풀기도 하는데 이를 반정규화라 하며, 그 대신 중복 관리 책임이 생깁니다.

```sql
-- 주문, 고객, 도시를 한 테이블에 넣은 비정규화 예
CREATE TABLE order_flat(order_id int, cust_name text, cust_city text, item text, qty int);
-- 고객 도시를 한 행만 고치면 같은 고객의 값이 어긋난다
UPDATE order_flat SET cust_city = 'Incheon' WHERE order_id = 1 AND item = 'pen';
```

(공식 문서) 정규형의 정의는 이번에 읽은 PostgreSQL 16과 MySQL 8.4 페이지에서 찾지 못했다. PostgreSQL 16 ddl-constraints 페이지의 주문-상품 예시는 다대다 관계를 `order_items` 연결 테이블로 나누고 `PRIMARY KEY (product_no, order_id)`를 두는데, 정규화된 설계가 어떤 모양인지 보여 주는 예 정도로만 참고했다.
(실험 확인) PostgreSQL 16.15에서 `kim`의 주문 3행 중 한 행만 도시를 바꾼 뒤 `SELECT DISTINCT cust_name, cust_city`를 하자 `kim`이 Incheon, Seoul 두 값으로 나왔다. 갱신 이상의 사례이고 MySQL 8.4.11에서도 같았다.
(보충) 1NF~3NF의 정의와 반정규화 설명은 데이터베이스 설계 이론의 일반 설명이며 공식 문서에 근거하지 않는다. BCNF와 그 이상의 정규형은 공식 출처로 확인할 수 없어 다루지 않았다.
