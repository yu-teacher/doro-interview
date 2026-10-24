---
slug: "vul-17"
topic: "security-web-vuln"
tier: TRICKY
difficulty: 3
title: "`PreparedStatement`를 쓰면 SQL 인젝션이 완전히 막히나요? 바인드 변수를 쓸 수 없는 곳은 어떻게 하나요?"
keywords: ["테이블명·컬럼명·정렬 방향은 바인드 불가", "허용 목록으로 매핑", "저장 프로시저 내부 동적 SQL", "HQL도 문자열 연결하면 취약", "최소 권한 DB 계정"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html", "https://owasp.org/Top10/2021/A03_2021-Injection/index.html"]
concepts: [injection]
importance: 2
links: [{to: "vul-02", kind: PREREQ}]
---
**모범 답변 (30~60초)**
아니요. 테이블명, 컬럼명, 정렬 방향 같은 SQL 구조 부분에는 바인드 변수를 쓸 수 없고, 이 부분에 사용자 입력을 이어 붙이면 `PreparedStatement`를 써도 취약합니다. 이럴 때는 입력을 그대로 쓰지 않고, 코드에 정의한 허용 값 목록에 매핑해서 목록에 있는 값만 쿼리에 붙입니다. 저장 프로시저도 내부에서 문자열을 이어 붙여 실행하면 똑같이 위험하고, HQL도 문자열을 연결해서 만들면 인젝션이 생깁니다. 마지막 방어선으로 애플리케이션이 쓰는 DB 계정에는 필요한 권한만 주고, 입력 검증은 보조로 둡니다.

```
order by ? 에 'balance' 바인드 -> [tom, jane, O'Brien]   (컬럼 정렬이 아니라 상수 정렬, 입력 순서 그대로)
order by balance desc          -> [O'Brien, jane, tom]
허용 목록 매핑("balance")       -> [O'Brien, jane, tom]
허용 목록에 없는 값             -> 거부(ValueError)
```

(원저자 자료) OWASP SQL Injection Prevention Cheat Sheet는 바인드 변수를 쓸 수 없는 테이블명, 컬럼명, 정렬 방향 같은 부분에는 입력 검증이나 쿼리 재설계가 가장 적절하다고 하고, 가능하면 이 값이 사용자 파라미터가 아니라 코드에서 오게 하라고 한다. 불가피하면 파라미터 값을 허용된 이름에 매핑하라고 하며, 사용자 파라미터로 테이블·컬럼을 정하는 것 자체가 나쁜 설계의 징후라고 말한다. 저장 프로시저는 안전하게 구현됐을 때만 프리페어드 문장과 같은 효과이고, 내부에서 `exec` 등으로 동적 SQL을 만들면 위험하다고 한다. HQL 문자열 연결도 같은 문제를 낳는다고 하며, 최소 권한 계정을 추가 방어로 권고한다. Top 10:2021 A03 페이지도 매개변수화된 저장 프로시저라도 내부에서 쿼리와 데이터를 이어 붙이면 SQL 인젝션이 생길 수 있고, SQL 구조(테이블명, 컬럼명 등)는 이스케이프할 수 없다고 한다.
(실험 확인) Python 3.14 `sqlite3`(SQLite 3.50.4)로 위 결과를 얻었다. `order by ?`에 문자열을 바인드하면 SQLite에서는 상수로 취급되어 정렬이 되지 않았는데, 다른 DB는 오류를 낼 수 있어 이 동작을 일반화하지는 않는다.
