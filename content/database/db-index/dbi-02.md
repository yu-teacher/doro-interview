---
slug: "dbi-02"
topic: "db-index"
tier: BASIC
difficulty: 1
title: "PostgreSQL의 B-tree 인덱스는 어떤 조건과 용도에 사용할 수 있나요?"
keywords: ["동등·범위 비교 연산자", "BETWEEN·IN·IS NULL", "앞부분 고정 LIKE", "정렬된 출력으로 ORDER BY", "C 로케일 아닐 때 연산자 클래스"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/indexes-types.html", "https://www.postgresql.org/docs/16/indexes-ordering.html", "https://www.postgresql.org/docs/16/indexes-opclass.html"]
---
**모범 답변 (30~60초)**
B-tree는 정렬할 수 있는 데이터에 대한 동등 조건과 범위 조건에 쓰입니다. 플래너는 <, <=, =, >=, > 연산자를 쓴 비교에 B-tree를 고려하고, 이를 조합한 BETWEEN과 IN, 그리고 IS NULL, IS NOT NULL에도 사용할 수 있습니다. LIKE 'foo%'처럼 패턴이 상수이고 문자열 앞부분이 고정된 경우도 쓸 수 있지만 LIKE '%bar'는 안 됩니다. 다만 데이터베이스가 C 로케일이 아니면 LIKE용 특별한 연산자 클래스로 인덱스를 만들어야 합니다. 또 B-tree는 정렬된 순서로 행을 돌려줄 수 있어 ORDER BY를 별도 정렬 없이 처리하는 데 쓰이고, 이는 PostgreSQL 인덱스 종류 중 B-tree만 가능합니다.

(공식 문서) Index Types 절(11.2.1)은 B-tree를 고려하는 비교 연산자를 `< <= = >= >`로 열거하고, BETWEEN·IN과 IS NULL·IS NOT NULL도 B-tree로 처리할 수 있다고 한다. LIKE와 `~`는 패턴이 상수이고 앞부분이 고정일 때(`col LIKE 'foo%'`, `col ~ '^foo'`) 가능하며 `col LIKE '%bar'`는 안 된다고 하고, C 로케일이 아니면 특별한 연산자 클래스가 필요하다고 한다(11.10의 `text_pattern_ops`). ILIKE와 `~*`는 패턴이 대소문자 영향을 받지 않는 문자로 시작할 때만 가능하다고 한다. 11.4는 PostgreSQL 인덱스 중 B-tree만 정렬된 출력을 낼 수 있고, 기본 저장 순서는 오름차순 NULLS LAST이며 역방향 스캔으로 DESC도 처리한다고 한다.
(실험 확인) 행 20만 개 `orders`(PostgreSQL 16.15)에서 `user_id BETWEEN 10 AND 12`는 `Index Cond: ((user_id >= 10) AND (user_id <= 12))`인 Bitmap Index Scan이었고, `ORDER BY id DESC LIMIT 5`는 정렬 노드 없이 기본 키 인덱스의 Index Scan Backward(버퍼 4개)였다. 전체의 약 10%가 NULL인 `memo` 컬럼의 `memo IS NULL`도 인덱스 조건(`Index Cond: (memo IS NULL)`)으로 쓰였다. 이 데이터베이스는 `en_US.utf8` 로케일이고 기본 연산자 클래스 인덱스로는 `LIKE 'User777%'`가 Seq Scan이었다(자세한 내용은 LIKE 질문 참고).
