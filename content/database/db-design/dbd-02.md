---
slug: "dbd-02"
topic: "db-design"
tier: BASIC
difficulty: 1
title: "기본키로 자연키와 대리키 중 무엇을 쓰고, PostgreSQL에서 대리키는 어떻게 만드나요?"
keywords: ["자연키는 값이 바뀔 수 있음", "대리키", "UNIQUE 제약 병행", "GENERATED ALWAYS AS IDENTITY", "serial은 시퀀스 표기"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/ddl-constraints.html", "https://www.postgresql.org/docs/16/datatype-numeric.html", "https://www.postgresql.org/docs/16/sql-createtable.html"]
concepts: [schema-design]
importance: 3
links: [{to: "dbd-03", kind: FOLLOWUP}, {to: "dbd-07", kind: FOLLOWUP}, {to: "dbs-01", kind: RELATED}, {to: "jpa-10", kind: RELATED}]
---
**모범 답변 (30~60초)**
자연키는 이메일처럼 업무 의미가 있는 값이고, 대리키는 의미 없이 시스템이 붙이는 번호입니다. 자연키는 값이 바뀔 수 있다는 게 문제인데, 바뀌면 그 값을 참조하는 외래키 행까지 모두 함께 고쳐야 합니다. 그래서 보통 대리키를 기본키로 두고, 업무상 유일해야 하는 값은 UNIQUE 제약으로 따로 보장합니다. PostgreSQL 16에서는 `GENERATED ALWAYS AS IDENTITY` 컬럼으로 대리키를 만들 수 있고, serial은 시퀀스를 붙여 주는 표기 편의일 뿐입니다. 어느 쪽이든 기본키에는 유니크 인덱스가 자동으로 생깁니다.

```sql
CREATE TABLE u_sur(
  id    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email text   NOT NULL UNIQUE
);
```

(공식 문서) ddl-constraints 페이지는 기본키가 유일하고 NOT NULL이어야 하며 자동으로 유니크 B-tree 인덱스가 만들어지고 외래키의 기본 참조 대상이 된다고 한다. datatype-numeric 페이지는 serial이 진짜 타입이 아니라 고유 식별 컬럼을 만들기 위한 표기 편의이며 시퀀스로 구현된다고 한다. sql-createtable 페이지는 `GENERATED ALWAYS`이면 명시한 값을 `OVERRIDING SYSTEM VALUE` 없이는 거절한다고 한다.
(실험 확인) PostgreSQL 16.15에서 이메일을 기본키로 쓰고 주문이 그 이메일을 외래키로 참조하는 구성은, 부모 이메일을 UPDATE하자 참조하는 행이 있다는 외래키 오류로 거절되었다(ON UPDATE CASCADE를 주지 않은 경우). 대리키 + UNIQUE 이메일 구성은 이메일 한 곳만 바꾸면 되었다. `GENERATED ALWAYS` identity 컬럼에 `id = 100`을 직접 넣는 INSERT는 오류가 났다.
(보충) 자연키가 불변이고 단일 컬럼이면 그대로 기본키로 써도 되며, 선택은 설계 판단이다. 대리키를 쓰더라도 업무 키에는 유니크 제약을 거는 것이 안전하다는 것은 일반 지침이다.
