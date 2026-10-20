---
slug: "misc-07"
topic: "spring-misc"
tier: DEEP
difficulty: 2
title: "Hikari 커넥션 풀 크기와 톰캣 스레드 수의 관계는 왜 중요한가요?"
keywords: ["HikariCP", "maximum-pool-size", "connectionTimeout", "커넥션 고갈", "트랜잭션 범위 최소화", "스레드 풀 vs 커넥션 풀"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-boot/appendix/application-properties/index.html", "https://docs.spring.io/spring-boot/reference/data/sql.html", "https://raw.githubusercontent.com/brettwooldridge/HikariCP/dev/README.md", "https://docs.spring.io/spring-framework/reference/data-access/transaction/tx-resource-synchronization.html"]
concepts: [connection-pool, thread-pool]
importance: 2
links: [{to: "dbp-21", kind: RELATED}, {to: "tx-17", kind: RELATED}, {to: "jpa-14", kind: RELATED}]
---
**모범 답변 (30~60초)**
톰캣 요청 처리 스레드는 기본 최대 200개인데, HikariCP의 기본 `maximumPoolSize`는 10개입니다. 요청이 모두 DB를 쓴다면 동시 요청이 100개 들어와도 커넥션은 10개뿐이라 나머지는 커넥션을 얻으려고 대기하고, `connectionTimeout`(기본 30초) 안에 얻지 못하면 예외가 납니다. 특히 `@Transactional` 메서드 안에서 외부 API 호출처럼 오래 걸리는 작업을 하면 커넥션을 오래 점유해서 풀이 금방 고갈됩니다. 그래서 트랜잭션은 짧게 유지하고 외부 호출은 트랜잭션 밖으로 빼며, 풀 크기는 "크게"가 아니라 DB가 감당할 수 있는 동시성에 맞춰 측정으로 정합니다.

(공식 문서) Boot 프로퍼티 목록은 `server.tomcat.threads.max`(워커 스레드 최대 개수)의 기본값을 200으로 적고, 가상 스레드를 켜면 이 설정이 효과가 없다고 한다. Boot의 SQL 문서는 HikariCP가 클래스패스에 있으면 항상 그것을 고르고, `spring-boot-starter-jdbc`나 `spring-boot-starter-data-jpa` 스타터를 쓰면 HikariCP 의존성이 자동으로 들어온다고 하며, 설정은 `spring.datasource.hikari.*`로 한다. HikariCP 문서(README)는 `maximumPoolSize`의 기본값이 10이고, 풀이 이 크기에 이르고 유휴 커넥션이 없으면 `getConnection()`이 `connectionTimeout`까지 막혔다가 시간이 지나면 `SQLException`을 던진다고 한다. `connectionTimeout`의 기본값은 30000ms(30초)다. 이 README는 커넥션이 너무 많으면 성능에 분명한 부정적 영향이 있다는 풀 크기 산정 자료도 안내한다. 트랜잭션 쪽에서는 리소스 동기화 문서가, 기존 트랜잭션에 연결된 커넥션이 있으면 그것을 돌려주고 없으면 새 커넥션을 만들어 같은 트랜잭션 안에서 재사용하게 한다고 설명한다.

(보충) "`@Transactional` 안에서 오래 걸리는 외부 호출을 하면 커넥션을 오래 쥔다"는 설명은 위 동작을 바탕으로 한 일반적인 정리다. 커넥션을 트랜잭션 시작 시점에 잡는지 첫 쿼리에서 잡는지는 사용하는 JPA 구현과 설정에 따라 다를 수 있다. "동시 요청 100개면 90개가 대기한다"는 숫자는 모든 요청이 동시에 커넥션을 요구한다고 가정한 계산이다.

(실험 확인) Boot 4.1.1, Java 21 환경에서 두 가지를 확인했다. 첫째, 풀 최대 크기를 2, `connectionTimeout`을 500ms로 만든 별도 Hikari 풀에서 커넥션 2개를 잡은 채 세 번째 `getConnection()`을 호출하면 약 0.5초 뒤 `SQLTransientConnectionException`(request timed out)이 났고, 커넥션을 반납하자 다시 얻을 수 있었다. 둘째, 설정 없이 띄운 앱의 Hikari 풀은 `maximumPoolSize=10`, `connectionTimeout=30000ms`였다.

```java
HikariConfig cfg = new HikariConfig();   // jdbcUrl 등 접속 설정은 생략
cfg.setMaximumPoolSize(2);
cfg.setConnectionTimeout(500);       // ms
try (HikariDataSource tiny = new HikariDataSource(cfg);
     Connection c1 = tiny.getConnection(); Connection c2 = tiny.getConnection()) {
    tiny.getConnection();            // 풀이 비어 500ms 후 SQLTransientConnectionException
}
```
