---
slug: "dbd-05"
topic: "db-design"
tier: BASIC
difficulty: 1
title: "PostgreSQL에서 json과 jsonb는 어떻게 다르고, JSON 컬럼은 언제 쓰나요?"
keywords: ["json은 원문 보존", "jsonb는 분해된 바이너리", "GIN 인덱스", "구조가 불규칙한 부가 속성", "핵심 데이터는 정형 컬럼"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/datatype-json.html"]
concepts: [schema-design]
importance: 1
links: [{to: "dbi-14", kind: RELATED}]
---
**모범 답변 (30~60초)**
json은 입력 텍스트를 그대로 저장해 공백, 키 순서, 중복 키를 보존하고 처리할 때마다 다시 파싱합니다. jsonb는 분해된 바이너리 형태로 저장해서 입력은 조금 느리지만 처리가 빠르고 GIN 인덱스를 쓸 수 있으며, 공백과 키 순서는 보존하지 않고 중복 키는 마지막 값만 남깁니다. 그래서 특별한 이유가 없으면 jsonb를 씁니다. JSON 컬럼은 속성이 제각각이거나 자주 바뀌는 부가 정보를 담을 때 적합하고, 조건과 조인에 쓰는 핵심 데이터는 정형 컬럼으로 두는 게 좋습니다. JSON 안의 구조는 대개 DB가 강제하지 않기 때문입니다.

```sql
SELECT '{"b": 1,  "a": 2, "a": 3}'::json  AS j,
       '{"b": 1,  "a": 2, "a": 3}'::jsonb AS jb;
CREATE INDEX ev_gin ON ev USING gin(payload jsonb_path_ops);
```

(공식 문서) datatype-json 페이지는 json이 입력 텍스트의 정확한 복사본을 저장해 공백, 키 순서, 중복 키를 보존하고, jsonb는 분해된 바이너리 형식이라 입력이 약간 느리지만 처리가 훨씬 빠르고 인덱싱을 지원하며 공백과 키 순서를 보존하지 않고 중복 키는 마지막 값만 남긴다고 한다. 대부분의 애플리케이션은 특수한 이유가 없으면 jsonb를 쓰라고 한다. 설계 절은 JSON 문서도 어느 정도 고정된 구조를 갖는 것이 좋고(구조는 대개 강제되지 않는다), 큰 문서를 갱신하면 행 전체에 락이 걸리므로 문서 크기를 제한하라고 한다. GIN 연산자 클래스 `jsonb_path_ops`는 `@>` 등을 지원하고 기본 클래스보다 인덱스가 작은 경우가 많다고 한다.
(실험 확인) PostgreSQL 16.15에서 `{"b": 1,  "a": 2, "a": 3}`은 json이 입력 그대로, jsonb가 `{"a": 3, "b": 1}`로 나왔다. 10만 행 jsonb 테이블(5000행 중 1행만 `type`이 rare)에서 `payload @> '{"type":"rare"}'`는 `jsonb_path_ops` GIN 인덱스를 Bitmap Index Scan으로 썼고, `payload->>'type' = 'rare'`는 표현식 B-tree 인덱스를 Index Scan으로 썼다. `{"n":"not-a-number"}`처럼 다른 행과 타입이 어긋난 값도 거절 없이 들어갔다.
(보충) "JSON은 부가 속성에만, 핵심은 정형 컬럼"이라는 기준은 문서의 설계 조언을 바탕으로 한 일반적인 실무 판단이다.
