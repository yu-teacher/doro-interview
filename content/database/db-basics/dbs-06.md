---
slug: "dbs-06"
topic: "db-basics"
tier: BASIC
difficulty: 1
title: "UNION과 UNION ALL은 어떻게 다르고 언제 UNION ALL을 쓰나요?"
keywords: ["UNION은 중복 제거", "UNION ALL은 그대로 이어붙임", "컬럼 수와 타입 호환", "UNION ALL이 대체로 더 빠름", "가능하면 UNION ALL"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/queries-union.html", "https://www.postgresql.org/docs/16/sql-select.html"]
---
**모범 답변 (30~60초)**
UNION은 두 쿼리 결과를 합치면서 DISTINCT처럼 중복 행을 제거하고, UNION ALL은 중복을 그대로 남긴 채 이어붙입니다. 두 쿼리는 컬럼 수가 같고 대응하는 컬럼 타입이 호환되어야 합니다. PostgreSQL 16 공식 문서는 UNION ALL이 대체로 훨씬 빠르니 가능하면 ALL을 쓰라고 하며, 중복이 없다고 확신하거나 중복이 있어도 상관없을 때가 그 경우입니다. 반대로 건수를 합산하는 것처럼 중복이 의미 있는 곳에 UNION을 쓰면 행이 사라져 값이 틀어집니다.

(공식 문서) PostgreSQL 16 queries-union 페이지는 UNION이 DISTINCT와 같은 방식으로 중복을 제거하고 ALL을 쓰면 제거하지 않는다고 하며, 두 쿼리의 컬럼 수와 타입이 호환되어야 한다고 설명한다. INTERSECT가 UNION, EXCEPT보다 먼저 결합된다는 점도 있다. sql-select 페이지는 UNION ALL이 보통 크게 더 빠르므로 가능하면 ALL을 쓰라고 한다.
(실험 확인) a = (1, 2, 2, 3), b = (2, 3, 3, 4)에서 `UNION`은 1, 2, 3, 4 네 행, `UNION ALL`은 여덟 행, `INTERSECT`는 2, 3, `EXCEPT`는 1이었다. PostgreSQL 16.15와 MySQL 8.4.11 모두 같았다. 속도 차이는 이 질문에서 측정하지 않았다.
