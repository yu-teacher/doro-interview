---
slug: "dbp-21"
topic: "db-tuning"
tier: TRICKY
difficulty: 2
title: "커넥션이 모자라면 max_connections를 올리면 되나요? 커넥션 풀은 어떻게 잡나요?"
keywords: ["연결마다 백엔드 프로세스", "max_connections 기본 100", "재시작 필요", "애플리케이션 커넥션 풀", "풀 크기 부하 테스트"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/connect-estab.html", "https://www.postgresql.org/docs/16/runtime-config-connection.html", "https://dev.mysql.com/doc/refman/8.4/en/connection-interfaces.html", "https://dev.mysql.com/doc/refman/8.4/en/server-system-variables.html"]
concepts: [connection-pool]
importance: 2
links: [{to: "dbp-15", kind: RELATED}, {to: "misc-07", kind: RELATED}, {to: "dbd-08", kind: RELATED}]
---
**모범 답변 (30~60초)**
PostgreSQL 16은 연결마다 백엔드 프로세스를 하나씩 띄우는 프로세스 모델이고, max_connections의 기본값은 100이며 서버를 재시작해야 바꿀 수 있습니다. 앱 인스턴스가 늘 때마다 max_connections만 올리는 건 연결마다 서버 자원이 들어서 좋은 해법이 아닙니다. 보통은 애플리케이션 쪽에 커넥션 풀을 두고 풀 크기를 DB가 감당할 수준으로 제한하며, 필요하면 PgBouncer 같은 외부 풀러를 앞에 둡니다. 풀 크기는 코어 수와 쿼리 특성을 보고 부하 테스트로 정합니다. MySQL 8.4(InnoDB)도 기본은 연결당 스레드 모델이고 max_connections 기본값은 151입니다.

```sql
SHOW max_connections;                 -- 100 (PostgreSQL 16.15)
SELECT pg_backend_pid();              -- 연결(세션)마다 다른 프로세스 ID
SHOW superuser_reserved_connections;  -- 3
```

(공식 문서) PostgreSQL Connection Estab 문서는 'process per user' 모델이라 클라이언트 연결마다 postmaster가 새 백엔드 프로세스를 띄운다고 한다. 연결 설정 문서는 max_connections 기본이 보통 100이고 서버 시작 시에만 설정할 수 있다고 하며, superuser_reserved_connections 등으로 일부 슬롯을 예약한다고 한다. MySQL 8.4 Connection Interfaces 문서는 연결마다 전용 스레드를 두는 모델이라 연결 수만큼 스레드가 생기고, 이 때문에 스레드 생성·소멸 비용, 스택 메모리, 스케줄링 오버헤드가 커질 수 있으며, thread_cache_size로 유휴 스레드를 캐시한다고 한다. 시스템 변수 문서의 max_connections 기본값은 151이다.
(실험 확인) PostgreSQL 16.15에서 세션 3개를 동시에 열자 `ps`에 `postgres: postgres exp_tuning [local] SELECT` 프로세스가 3개(PID 2466~2468)로 보였고 각 세션의 pg_backend_pid가 서로 달랐다. `SHOW max_connections`는 100, superuser_reserved_connections는 3, reserved_connections는 0이었다. MySQL 8.4.11은 thread_handling=one-thread-per-connection, max_connections=151, thread_cache_size=9였다. 실제로 한도에 도달하는 실험은 공용 컨테이너라 하지 않았다.
(보충) PgBouncer 같은 외부 풀러와 풀 크기 산정 요령, 그리고 max_connections만 올리는 것이 좋은 해법이 아니라는 판단은 공식 문서 범위 밖의 일반적 실무 설명이며, 이 저장소의 읽은 문서에서 다루지 않았다. 문서는 연결마다 백엔드 프로세스(PostgreSQL)·스레드(MySQL)가 생기고 MySQL 쪽은 스레드마다 자원 비용이 든다고만 말한다.
