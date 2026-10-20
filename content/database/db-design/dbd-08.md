---
slug: "dbd-08"
topic: "db-design"
tier: BASIC
difficulty: 1
title: "PostgreSQL을 새로 구성할 때 연결 수, 인코딩, 타임존 같은 기본값은 무엇을 확인하나요?"
keywords: ["max_connections 기본 100", "커넥션 풀", "인코딩 UTF8", "LC_COLLATE 생성 후 변경 불가", "MySQL utf8mb4"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/runtime-config-connection.html", "https://www.postgresql.org/docs/16/locale.html", "https://www.postgresql.org/docs/16/multibyte.html", "https://www.postgresql.org/docs/16/datatype-datetime.html", "https://dev.mysql.com/doc/refman/8.4/en/charset-server.html", "https://dev.mysql.com/doc/refman/8.4/en/charset-unicode-utf8mb4.html", "https://dev.mysql.com/doc/refman/8.4/en/charset-unicode-utf8mb3.html"]
concepts: [connection-pool, schema-design]
importance: 1
links: [{to: "dbp-21", kind: RELATED}]
---
**모범 답변 (30~60초)**
PostgreSQL 16의 max_connections 기본값은 보통 100이고 서버를 시작할 때만 바꿀 수 있으며, 일부 슬롯은 슈퍼유저용으로 예약됩니다. 연결 수를 무작정 늘리기보다 애플리케이션의 커넥션 풀 크기를 맞추는 쪽이 일반적입니다. 인코딩은 initdb가 로케일에 맞춰 클러스터 기본값(UTF8인지 확인)으로 정하고, LC_COLLATE와 LC_CTYPE은 데이터베이스를 만든 뒤에는 바꿀 수 없어서 처음에 정해야 합니다. 타임존은 세션의 TimeZone 설정이 시각 표시와 해석에 영향을 줍니다. MySQL 8.4(InnoDB)에서는 기본 문자셋이 utf8mb4이고, utf8mb3는 이모지 같은 4바이트 문자를 저장하지 못합니다.

```sql
SHOW max_connections;          -- 100
SELECT pg_encoding_to_char(encoding), datcollate FROM pg_database WHERE datname = current_database();
SHOW TimeZone;
```

(공식 문서) runtime-config-connection 페이지는 max_connections 기본이 보통 100(커널 설정이 못 받쳐 주면 더 작을 수 있음)이고 서버 시작 때만 설정할 수 있으며, superuser_reserved_connections 기본은 3이라고 한다. locale 페이지는 LC_COLLATE와 LC_CTYPE은 데이터베이스 생성 시 고정되어 이후 바꿀 수 없다고 한다(인덱스 정렬 순서에 영향). multibyte 페이지는 initdb가 클러스터 기본 인코딩을 정하며 지정하지 않으면 로케일에서 추정한다고 하고, 다른 인코딩·로케일의 데이터베이스는 template0을 복사해 만들며 다른 데이터베이스를 복사할 때는 인코딩과 로케일을 바꿀 수 없다고 한다. MySQL 8.4 charset-server 페이지는 서버 문자셋과 콜레이션의 기본값이 utf8mb4와 utf8mb4_0900_ai_ci라고 하고, utf8mb4/utf8mb3 페이지는 utf8mb4가 4바이트 문자(보충 문자)를 지원하고 utf8mb3는 BMP 문자만 지원하며 deprecated라고 한다.
(실험 확인) 이 PostgreSQL 16.15 컨테이너는 `max_connections` 100, `superuser_reserved_connections` 3, 인코딩 UTF8, 로케일 `en_US.utf8`, TimeZone UTC, DateStyle `ISO, MDY`였고 `statement_timeout`, `lock_timeout`, `idle_in_transaction_session_timeout`은 모두 0(무제한)이었다. 이모지 1자와 한글 2자(`'😀한글'`)는 `length` 3, `octet_length` 10이었다. `lock_timeout` 서버 기본값도 0이었다. 로케일이 `en_US.utf8`인 서버에서 `ENCODING 'LATIN1'` 데이터베이스를 만들려 하면 로케일과 맞지 않는다는 오류가 났다. MySQL 8.4.11은 `character_set_server` utf8mb4, 콜레이션 `utf8mb4_0900_ai_ci`(대소문자 구분 안 함, `'a' = 'A'`이 1), `max_connections` 151이었고 `utf8mb3` 컬럼에 이모지를 넣으면 오류 1366이 났다(연결 문자셋을 utf8mb4로 지정한 클라이언트로 실행).
(보충) 연결 수는 커넥션 풀과 함께 정한다는 점, 서버 타임존을 UTC로 통일한다는 운영 관행은 문서에 근거가 있는 것이 아니라 일반 지침이다.
