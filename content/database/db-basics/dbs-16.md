---
slug: "dbs-16"
topic: "db-basics"
tier: DEEP
difficulty: 2
title: "PostgreSQL의 timestamp와 timestamptz는 어떻게 다르고, MySQL의 DATETIME, TIMESTAMP와는 어떻게 대응되나요?"
keywords: ["timestamptz는 UTC로 저장", "세션 시간대로 표시", "timestamp는 시간대를 무시", "MySQL TIMESTAMP는 UTC 변환", "MySQL DATETIME은 변환 없음"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/datatype-datetime.html", "https://dev.mysql.com/doc/refman/8.4/en/datetime.html"]
concepts: [schema-design]
importance: 1
links: [{to: "dbd-06", kind: RELATED}]
---
**모범 답변 (30~60초)**
PostgreSQL 16의 timestamp(without time zone)는 입력에 붙은 시간대를 무시하고 날짜와 시각 값을 그대로 저장합니다. timestamptz(with time zone)는 입력을 UTC로 환산해 저장하고 출력할 때 현재 세션의 TimeZone 설정으로 바꿔 보여 주기 때문에, 같은 순간을 세션마다 다른 시각으로 봅니다. 시각 자체가 의미 있는 이벤트 시간에는 보통 timestamptz가 더 안전합니다. MySQL 8.4에서는 TIMESTAMP가 이와 비슷하게 UTC로 저장하고 연결의 시간대로 변환해 돌려주며, DATETIME은 저장한 값을 시간대 변환 없이 그대로 보여 줍니다. 다만 TIMESTAMP는 2038년까지만 표현합니다.

```sql
SET timezone = 'UTC';
INSERT INTO tz_t VALUES (1, '2026-01-01 09:00:00+09', '2026-01-01 09:00:00+09');
-- timestamp 열: 09:00:00 (+09는 무시), timestamptz 열: 00:00:00+00 (UTC로 환산)
SET timezone = 'Asia/Seoul';  -- timestamptz 열만 09:00:00+09로 바뀌어 보인다
```

(공식 문서) PostgreSQL 16 datatype-datetime 페이지는 timestamptz가 명시한 시간대를 UTC로 환산해 저장하고 원래 시간대는 유지하지 않으며, 출력 시 현재 `TimeZone`으로 변환한다고 설명한다. timestamp 값 입력의 시간대 표시는 조용히 무시된다고 한다. MySQL 8.4 datetime 페이지는 TIMESTAMP가 현재 시간대에서 UTC로 변환해 저장하고 조회 시 되돌리며 DATETIME에는 이 변환이 없다고 한다. TIMESTAMP 범위는 1970-01-01 00:00:01 UTC부터 2038-01-19 03:14:07 UTC까지다.
(실험 확인) PostgreSQL 16.15에서 위 결과가 그대로 나왔다. 오프셋 없는 `'2026-01-01 09:00:00'`은 세션 시간대(UTC)로 해석되어 `Asia/Seoul` 세션에서 18:00+09로 보였다. MySQL 8.4.11은 `TIMESTAMP` 컬럼에 2040-01-01을 넣으면 오류(1292)였다. 또 세션을 `+00:00`으로 두고 `'2026-01-01 09:00:00+09:00'`를 넣자 `DATETIME`과 `TIMESTAMP` 모두 00:00:00으로 저장했고, 세션을 `+09:00`으로 바꾸자 `TIMESTAMP`만 09:00:00으로 바뀌고 `DATETIME`은 00:00:00 그대로였다. 즉 MySQL은 오프셋 입력을 `DATETIME`에서도 세션 시간대로 환산해 넣었다는 점이 PostgreSQL의 timestamp와 달랐다.
(보충) 이벤트 시각에는 timestamptz가 보통 더 안전하다는 선택 기준은 일반적인 실무 판단이며 문서가 정한 규칙은 아니다.
