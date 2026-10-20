---
slug: "dbd-06"
topic: "db-design"
tier: BASIC
difficulty: 2
title: "PostgreSQL에서 timestamp와 timestamptz 중 무엇을 쓰고, 타임존은 어떻게 다뤄지나요?"
keywords: ["timestamptz는 UTC로 저장", "세션 TimeZone으로 표시", "timestamp는 타임존 정보 없음", "MySQL TIMESTAMP 2038 범위", "DATETIME은 변환 없음"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/datatype-datetime.html", "https://dev.mysql.com/doc/refman/8.4/en/datetime.html"]
---
**모범 답변 (30~60초)**
PostgreSQL 16의 timestamptz는 입력을 UTC로 바꿔 저장하고, 조회할 때는 세션의 TimeZone 설정에 맞춰 바꿔 보여 줍니다. 입력에 오프셋이 없으면 세션 TimeZone 기준으로 해석하고, 원래 입력한 타임존 자체는 저장하지 않습니다. 반면 timestamp는 타임존 개념 없이 넣은 값을 그대로 저장해서 어느 시점인지 알 수 없습니다. 그래서 실제로 일어난 시각은 timestamptz로 저장하는 편이 안전합니다. MySQL 8.4(InnoDB)에서는 TIMESTAMP가 UTC로 변환해 저장하고 범위가 2038년까지이며, DATETIME은 변환 없이 값을 그대로 저장합니다.

```sql
SET timezone = 'UTC';
INSERT INTO ts VALUES ('2026-10-20 09:00:00+09', '2026-10-20 09:00:00+09'); -- (timestamptz, timestamp)
SET timezone = 'Asia/Seoul';
SELECT a, b FROM ts;  -- a는 09:00+09로 보이고, b는 09:00 그대로
```

(공식 문서) PostgreSQL 16 datatype-datetime 페이지는 timestamptz의 명시적 타임존이 있는 입력은 UTC로 변환되고, 타임존이 없으면 세션 TimeZone으로 가정해 UTC로 변환되며 원래 타임존은 보존되지 않는다고 한다. 타임존 인식 값은 내부적으로 UTC로 저장되고 표시할 때 TimeZone 설정으로 변환된다고 한다. MySQL 8.4 datetime 페이지는 TIMESTAMP를 현재 타임존에서 UTC로 변환해 저장하고 조회 때 다시 변환하며(DATETIME에는 해당 없음), 범위가 1970-01-01 00:00:01 UTC부터 2038-01-19 03:14:07 UTC까지라고 한다.
(실험 확인) PostgreSQL 16.15에서 UTC 세션으로 `2026-10-20 09:00:00+09`를 timestamptz와 timestamp 컬럼에 넣으면 timestamptz는 `2026-10-20 00:00:00+00`, timestamp는 `2026-10-20 09:00:00`이었다. 세션을 `Asia/Seoul`로 바꾸자 timestamptz는 `09:00:00+09`로 보였고 timestamp는 그대로였다. 오프셋 없는 `'2026-10-20 09:00:00'::timestamptz`는 세션 존(Seoul) 기준이었다. 두 타입 모두 8바이트였다. MySQL 8.4.11에서 세션 `+00:00`으로 저장한 뒤 `+09:00` 세션으로 읽으면 TIMESTAMP는 `18:00:00`, DATETIME은 `09:00:00` 그대로였고, UTC 세션에서 `2038-01-19 03:14:08`을 TIMESTAMP에 넣으면 오류 1292가 났다.
(보충) 서버와 DB의 타임존을 UTC로 통일하고 화면에서만 변환하라는 방침은 일반적인 운영 관행이다.
