---
slug: "dbd-17"
topic: "db-design"
tier: DEEP
difficulty: 3
title: "PostgreSQL에서 멀티테넌시를 구현하는 방식과 각각의 트레이드오프, 행 수준 보안(RLS)은 어떻게 쓰나요?"
keywords: ["tenant_id 공유 테이블", "스키마 분리와 search_path", "데이터베이스 분리", "RLS 정책", "소유자와 슈퍼유저는 우회"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/ddl-rowsecurity.html", "https://www.postgresql.org/docs/16/ddl-schemas.html"]
---
**모범 답변 (30~60초)**
크게 세 가지입니다. 하나의 테이블에 tenant_id 컬럼을 두고 모든 테넌트가 공유하는 방식은 관리가 가장 단순하지만 격리를 쿼리와 정책에 의존합니다. 테넌트마다 스키마를 나누는 방식은 같은 테이블 이름을 스키마별로 두고 search_path로 고르며 테이블 수가 테넌트 수만큼 늘어 마이그레이션이 번거롭습니다. 테넌트마다 데이터베이스를 두면 격리는 가장 강하지만 연결과 운영 단위가 늘어납니다. 공유 테이블 방식에서는 RLS 정책으로 tenant_id가 맞는 행만 보이게 하면 애플리케이션 실수에 대한 안전장치가 되지만, 테이블 소유자와 슈퍼유저는 기본적으로 RLS를 우회합니다.

```sql
ALTER TABLE inv ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_iso ON inv
  USING      (tenant_id = current_setting('app.tenant_id')::int)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::int);
```

(공식 문서) PostgreSQL 16 ddl-rowsecurity 페이지는 테이블에 행 보안을 켜면 정책이 허용한 행만 접근할 수 있고 정책이 없으면 모든 행이 막히는 기본 거부이며, 슈퍼유저와 `BYPASSRLS` 역할은 항상 우회하고 테이블 소유자도 보통 우회하지만 `FORCE ROW LEVEL SECURITY`로 적용받게 할 수 있다고 한다. 정책식은 쿼리 조건보다 먼저 평가되고, 참조 무결성 검사는 행 보안을 우회한다고 한다. ddl-schemas 페이지는 스키마로 이름 충돌 없이 객체를 나눌 수 있고 `search_path`로 이름을 해석하며, 모르는 사용자가 있는 환경에서는 search_path에 스키마를 넣는 것이 그 스키마 소유자를 신뢰하는 일이라고 경고한다.
(실험 확인) PostgreSQL 16.15에서 `inv` 테이블에 정책을 건 뒤 일반 역할이 `app.tenant_id = 1`로 조회하면 해당 테넌트의 2행만 보였고, 다른 테넌트(2)의 행을 INSERT하려 하면 "new row violates row-level security policy" 오류가 났다. 정책이 아직 없을 때는 일반 역할이 0행을 보았고(기본 거부), 슈퍼유저(`postgres`)는 정책과 무관하게 모든 행을 보았다. 슈퍼유저가 아닌 테이블 소유자는 따로 확인하지 않았다. 스키마 방식은 `tenant_a`, `tenant_b`에 같은 이름의 테이블을 두고 `search_path`를 바꾸면 각 스키마의 `inv`로 해석되었다.
(보충) 멀티테넌시 세 방식의 구분과 장단점(관리 단순성, 격리 강도, 마이그레이션 부담, 연결 수), RLS가 애플리케이션 실수에 대한 안전장치가 된다는 설명은 일반적인 설계 비교이며 문서가 멀티테넌시를 다루거나 순위를 정한 것은 아니다.
