---
slug: "dbs-04"
topic: "db-basics"
tier: BASIC
difficulty: 1
title: "NULL은 어떻게 비교하고, `= NULL`이 왜 동작하지 않나요?"
keywords: ["NULL은 알 수 없는 값", "비교 결과는 NULL(unknown)", "IS NULL", "IS DISTINCT FROM", "WHERE는 true만 통과"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/functions-comparison.html", "https://www.postgresql.org/docs/16/queries-table-expressions.html"]
---
**모범 답변 (30~60초)**
NULL은 값이 없다는 뜻이 아니라 알 수 없는 값이어서, 일반 비교 연산자에 NULL이 들어가면 결과가 true도 false도 아닌 NULL(unknown)이 됩니다. 그래서 `x = NULL`이나 `x <> NULL`은 항상 NULL이고, WHERE는 true인 행만 통과시키므로 어떤 행도 나오지 않습니다. NULL인지 검사하려면 `IS NULL`, `IS NOT NULL`을 써야 합니다. PostgreSQL 16 기준으로 NULL을 보통 값처럼 비교하고 싶으면 `IS DISTINCT FROM`을 쓰면 됩니다. 같은 이유로 `bonus <> 100` 조건은 bonus가 NULL인 행도 걸러냅니다.

(공식 문서) PostgreSQL 16 functions-comparison 페이지는 일반 비교 연산자가 입력 중 하나라도 NULL이면 true나 false가 아니라 NULL을 돌려주고, `expression = NULL`처럼 쓰지 말라고 안내한다. `IS DISTINCT FROM`은 NULL을 일반 값처럼 취급하는 비교다. queries-table-expressions 페이지는 WHERE 조건이 true인 행만 남고 false나 NULL이면 버린다고 설명한다.
(실험 확인) 7행 `emp` 테이블(bonus는 4행이 NULL, 나머지 100, 50, 10)에서 `WHERE bonus <> 100`은 bonus가 50, 10인 2행만 반환했고, `WHERE bonus = NULL`은 0행이었다. `NULL = NULL`, `NULL <> 1`은 NULL이었고 `NULL AND FALSE`는 false, `NULL OR TRUE`는 true, `NULL AND TRUE`는 NULL이었다. PostgreSQL 16.15와 MySQL 8.4.11 모두 같은 결과였다(MySQL은 boolean을 0, 1로 표시). MySQL 8.4.11에서 `IS DISTINCT FROM`은 문법 오류(1064)였다.
