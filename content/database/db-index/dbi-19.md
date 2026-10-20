---
slug: "dbi-19"
topic: "db-index"
tier: TRICKY
difficulty: 3
title: "고유값이 적은(카디널리티가 낮은) 컬럼에는 인덱스를 만들어도 소용없나요?"
keywords: ["고유값 수보다 선택도", "흔한 값은 인덱스 미사용", "희귀 값 조회에는 유용", "부분 인덱스로 보완", "<> 조건은 B-tree 연산자 아님"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/indexes-partial.html", "https://www.postgresql.org/docs/16/indexes-types.html", "https://www.postgresql.org/docs/16/indexes-examine.html", "https://www.postgresql.org/docs/16/planner-stats.html"]
concepts: [index-design, query-planner]
importance: 2
links: [{to: "dbi-07", kind: PREREQ}]
---
**모범 답변 (30~60초)**
무조건 소용없는 것은 아니고, 중요한 것은 고유값 개수가 아니라 쿼리가 고르는 값이 전체 행의 몇 퍼센트인가입니다. 공식 문서는 전체 행의 몇 퍼센트를 넘는 흔한 값은 어차피 인덱스를 쓰지 않는다고 설명합니다. 예를 들어 상태 컬럼이 DONE 95%, PAID 4%, NEW 1%라면 status = 'DONE' 조회에는 인덱스가 쓰이지 않지만 희귀한 NEW 조회에는 쓰일 수 있습니다. 그래서 희귀한 값만 자주 조회한다면 status = 'NEW' 조건의 부분 인덱스로 크기를 크게 줄여서 만드는 편이 낫습니다. 또 B-tree가 고려하는 연산자 목록에 <>가 없고, 실험에서도 일치 행이 적은 <> 조건은 인덱스를 쓰지 못했습니다.

(공식 문서) PostgreSQL 11.8은 전체 행의 몇 퍼센트를 넘는 흔한 값을 찾는 쿼리는 인덱스를 쓰지 않으므로 그 행들을 인덱스에 둘 이유가 없고, 이를 제외하면 인덱스가 작아져 그 인덱스를 쓰는 쿼리가 빨라지고 갱신도 빨라진다고 한다. 11.2.1은 B-tree가 고려하는 비교 연산자를 `< <= = >= >`로 열거하며 `<>`는 목록에 없다. 14.2는 플래너가 `pg_stats`의 최빈값 빈도 같은 통계로 선택도를 추정한다고 한다.
(실험 확인) PostgreSQL 16.15, 행 20만 개 `orders`에서 `status`는 DONE 189,945(95%), PAID 8,034, NEW 2,021(1%)이었다. `status` 단일 인덱스(1,368 kB)가 있어도 `status = 'DONE'`은 Seq Scan이었고 `status = 'NEW'`는 인덱스(부분 인덱스)를 썼다. `status <> 'DONE'`은 인덱스가 있든 없든 Seq Scan이었다. 일치 행이 5개뿐인 별도 테이블의 `s <> 'A'`도 `enable_seqscan = off`에서조차 Seq Scan이었고, `s < 'A' OR s > 'A'`로 바꿔 쓰면 BitmapOr로 인덱스를 썼다. `status = 'NEW'` 부분 인덱스는 64 kB였다. MySQL 8.4.11에서는 같은 분포에서 `status = 'DONE'`이 `ref`로 `idx_status`를 선택했고 예상 행 수는 99,738, 실제는 190,126행이었다. 즉 MySQL의 인덱스 선택과 추정이 PostgreSQL과 다르게 나왔으며, 이 데이터·버전에서 나온 결과일 뿐 일반화하지 않는다.
