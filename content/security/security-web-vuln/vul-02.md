---
slug: "vul-02"
topic: "security-web-vuln"
tier: BASIC
difficulty: 1
title: "SQL 인젝션은 무엇이고, `PreparedStatement`로 어떻게 막나요?"
keywords: ["입력이 SQL 구조를 바꿈", "문자열 연결 금지", "바인드 변수", "코드와 데이터 분리"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html", "https://owasp.org/Top10/2021/A03_2021-Injection/index.html", "https://docs.oracle.com/en/java/javase/25/docs/api/java.sql/java/sql/PreparedStatement.html"]
concepts: [injection]
importance: 3
links: [{to: "vul-17", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
SQL 인젝션은 사용자 입력을 문자열로 이어 붙여 쿼리를 만들 때, 입력이 데이터가 아니라 SQL 구조의 일부로 해석되는 취약점입니다. 기본 방어는 문자열 연결을 쓰지 않고, `PreparedStatement`로 SQL을 먼저 정의한 다음 `?` 자리에 값을 바인드하는 것입니다. OWASP는 이렇게 하면 입력이 무엇이든 데이터베이스가 코드와 데이터를 구분하므로 공격자가 쿼리의 의도를 바꿀 수 없다고 설명하고, 입력에 따옴표나 SQL 키워드가 섞여 있어도 마찬가지입니다. HQL을 쓸 때도 문자열을 이어 붙이지 말고 이름 있는 파라미터로 값을 넘겨야 합니다.

```
select name, balance from users where name = ?     -- 값은 바인드
"tom' or '1'='1" -> []                       (따옴표가 든 문자열 전체를 이름 값으로 비교)
"O'Brien"        -> [("O'Brien", 30)]        (정상적인 아포스트로피도 별도 이스케이프 없이 동작)
```

(원저자 자료) OWASP SQL Injection Prevention Cheat Sheet는 SQL 인젝션이 문자열 연결로 만든 동적 쿼리와 사용자 입력 때문에 생긴다고 설명하고, 1차 방어로 바인드 변수를 쓰는 준비된 문장, 안전하게 작성한 저장 프로시저, 허용 목록 입력 검증을 제시하며 모든 입력을 이스케이프하는 방식은 강하게 말린다. 준비된 문장은 SQL 코드를 먼저 정의하고 매개변수를 나중에 넘기게 해서 데이터베이스가 코드와 데이터를 구분하게 한다고 하고, HQL도 같은 방식의 이름 있는 파라미터를 지원한다고 한다. OWASP Top 10:2021 A03 페이지도 안전한 API, 즉 매개변수화된 인터페이스를 선호하는 방법으로 꼽는다.
(공식 문서) Java SE 25 `PreparedStatement` 문서는 이 객체를 미리 컴파일된 SQL 문장을 나타내는 것으로 설명하고, `setString` 같은 setter로 IN 매개변수 값을 지정한다고 한다.
(실험 확인) Python 3.14의 `sqlite3`(SQLite 3.50.4)로 위 결과를 얻었다. 자바 JDBC 드라이버는 환경에 없어서 JDBC 코드는 직접 실행하지 못했고, 같은 바인드 원리를 SQLite 드라이버로 확인한 것이다.
