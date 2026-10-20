---
slug: "dbi-05"
topic: "db-index"
tier: BASIC
difficulty: 2
title: "인덱스를 많이 만들면 왜 쓰기 성능이 나빠지나요?"
keywords: ["쓰기마다 모든 인덱스 갱신", "저장 공간 증가", "HOT 업데이트", "인덱스 컬럼 변경", "안 쓰는 인덱스 제거"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/indexes-intro.html", "https://www.postgresql.org/docs/16/storage-hot.html", "https://www.postgresql.org/docs/16/btree-implementation.html", "https://www.postgresql.org/docs/16/monitoring-stats.html"]
---
**모범 답변 (30~60초)**
인덱스는 테이블과 별도로 저장되기 때문에 행을 INSERT, UPDATE, DELETE 할 때마다 그 테이블의 인덱스를 함께 갱신해야 하고, 인덱스가 많을수록 쓰기 비용과 저장 공간이 늘어납니다. PostgreSQL 16에서는 UPDATE가 인덱스에 걸린 컬럼을 바꾸지 않고 같은 페이지에 여유 공간이 있으면 HOT 업데이트로 새 인덱스 항목 없이 처리할 수 있습니다. 하지만 인덱스 컬럼 하나만 바꿔도 그 테이블의 모든 인덱스에 새 항목이 필요합니다. 그래서 읽기 이득이 쓰기 비용보다 큰 인덱스만 두고, 거의 안 쓰는 인덱스는 지웁니다. 사용 횟수는 pg_stat_user_indexes의 idx_scan으로 볼 수 있습니다.

(공식 문서) 11.1은 인덱스를 테이블과 동기화하는 데 데이터 변경 연산의 오버헤드가 들고, 인덱스가 heap-only tuple 생성을 막을 수 있으니 거의 안 쓰는 인덱스는 지우라고 한다. 73.7(HOT)은 인덱스가 참조하는 컬럼을 UPDATE가 바꾸지 않고(BRIN 같은 summarizing 인덱스는 제외) 옛 행이 있는 페이지에 여유 공간이 있을 때 HOT이 가능하다고 한다. 67.4는 인덱스에 걸린 컬럼 하나만 바꾸는 UPDATE도 그 컬럼을 포함하지 않는 인덱스까지 포함해 테이블의 모든 인덱스에 새 인덱스 튜플을 필요로 한다고 한다. 모니터링 통계 문서는 `idx_scan`을 해당 인덱스에서 시작된 인덱스 스캔 수로 정의한다.
(실험 확인) PostgreSQL 16.15에서 같은 컬럼 6개짜리 테이블 두 개에 30만 행을 넣었다. 기본 키만 있는 쪽은 419 ms, 기본 키와 보조 인덱스 5개가 있는 쪽은 2,397 ms였고, 총 크기는 33 MB와 90 MB(힙은 둘 다 27 MB)였다. 한 컬럼을 10만 행에서 갱신하는 데 인덱스가 없는 컬럼이면(기본 키만 있는 테이블) 171 ms, 보조 인덱스가 걸린 컬럼이면(보조 인덱스 5개 테이블) 1,641 ms였다. fillfactor 70 테이블에서 2만 행 UPDATE는 인덱스 컬럼이 아닌 `b`를 바꿀 때 HOT이 8,694건이고 인덱스 컬럼 `a`를 바꿀 때는 0건이었다(2만 건 중 8,694건만 HOT이 된 이유는 확인하지 않았다). fillfactor 100으로 새로 채운 테이블에서는 인덱스 없는 컬럼 `b`를 2만 행 바꿔도 HOT이 0건이어서, 문서가 말하는 페이지 여유 공간 조건이 필요하다는 설명과 맞는다. 수치는 이 환경과 데이터에서 나온 값이다.
