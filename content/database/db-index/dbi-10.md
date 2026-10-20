---
slug: "dbi-10"
topic: "db-index"
tier: DEEP
difficulty: 2
title: "부분 인덱스(Partial Index)는 언제 쓰고 어떤 제약이 있나요?"
keywords: ["술어를 만족하는 행만 색인", "흔한 값 제외로 크기 감소", "일부 행에만 유니크 강제", "쿼리 조건이 술어를 함의해야 함", "파라미터 쿼리에서는 못 씀"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/indexes-partial.html", "https://www.postgresql.org/docs/16/runtime-config-query.html"]
---
**모범 답변 (30~60초)**
부분 인덱스는 WHERE 술어를 만족하는 행만 담는 인덱스입니다. 테이블 대부분을 차지해 어차피 인덱스를 안 쓰는 흔한 값이나 쿼리가 관심 없는 값을 빼서 인덱스를 작게 만들고 갱신 비용도 줄이며, 또 WHERE success 같은 조건으로 일부 행에 대해서만 유일성을 강제하는 유니크 인덱스로도 씁니다. 다만 쿼리의 WHERE가 인덱스 술어를 함의한다고 플래너가 알아볼 수 있어야 쓰이는데, 일반적인 증명기가 없어서 단순한 부등식 외에는 술어가 쿼리 조건에 그대로 들어 있어야 합니다. 매칭이 계획 시점에 일어나서 파라미터화된 조건은 안 된다고 문서는 설명하는데, 실험에서는 범용(generic) 계획에서만 못 썼습니다.

```sql
CREATE INDEX orders_new_partial ON orders (created_at) WHERE status = 'NEW';
CREATE UNIQUE INDEX tests_ok ON tests (subject, target) WHERE success;
```

(공식 문서) 11.8은 부분 인덱스의 용도로 흔한 값 제외(크기와 갱신 비용 감소), 관심 없는 값 제외, 일부 행에 대한 부분 유니크 인덱스를 든다. 쿼리의 WHERE가 인덱스 술어를 수학적으로 함의한다고 시스템이 인식할 수 있을 때만 쓰이고, 정교한 정리 증명기는 없어서 `x < 1`이 `x < 2`를 함의하는 정도의 단순한 경우 외에는 술어가 쿼리 조건과 정확히 일치해야 하며, 매칭이 계획 시점에 일어나므로 파라미터화된 조건은 부분 인덱스에서 동작하지 않는다고 한다(`x < ?`는 모든 파라미터 값에 대해 `x < 2`를 함의하지 않는다는 예). 겹치지 않는 부분 인덱스 여러 개를 파티셔닝 대용으로 만드는 것은 나쁜 생각이고 `(category, data)` 하나나 테이블 파티셔닝이 낫다고 한다. 대부분의 경우 일반 인덱스 대비 이득은 미미하다고도 한다.
(실험 확인) PostgreSQL 16.15, 행 20만 개 `orders`에서 `status = 'NEW'`는 2,021행(약 1%)이다. `created_at`에 대한 부분 인덱스는 64 kB, `status` 단일 인덱스는 1,368 kB, `(status, created_at)` 인덱스는 6,184 kB였다. `status = 'NEW' AND created_at >= '2026-09-01'`은 부분 인덱스를 썼다(263행, 0.267 ms). `amount < 1000` 조건의 부분 인덱스는 `amount < 500 AND user_id = 777`에도 쓰여 문서가 말한 단순 부등식 함의가 확인됐다. `PREPARE`로 `status = $1`을 받고 `plan_cache_mode = force_generic_plan`으로 강제하면 Seq Scan, `force_custom_plan`이면 부분 인덱스를 썼다. 즉 문서의 일반적 서술과 달리 값이 계획 시점에 알려지는 custom plan에서는 부분 인덱스가 쓰였다. 부분 인덱스만 있고 `status = 'PAID'` 조건이면 이 인덱스는 쓸 수 없어 Seq Scan이었다. `UNIQUE (subject, target) WHERE success`는 성공 행 두 번째 삽입을 거부하고 실패 행은 여러 개 허용했다.
