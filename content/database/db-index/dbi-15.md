---
slug: "dbi-15"
topic: "db-index"
tier: DEEP
difficulty: 3
title: "MySQL InnoDB의 클러스터형 인덱스는 PostgreSQL의 인덱스 구조와 어떻게 다르고, 어떤 차이가 생기나요?"
keywords: ["기본 키가 클러스터형 인덱스", "보조 인덱스에 기본 키 포함", "PostgreSQL 힙과 모든 인덱스 분리", "기본 키 길이와 보조 인덱스 크기", "보조 인덱스 조회 후 PK 재탐색"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://dev.mysql.com/doc/refman/8.4/en/innodb-index-types.html", "https://www.postgresql.org/docs/16/indexes-index-only-scans.html", "https://www.postgresql.org/docs/16/btree-implementation.html"]
concepts: [index-structure]
importance: 2
links: [{to: "dbd-03", kind: RELATED}]
---
**모범 답변 (30~60초)**
MySQL 8.4(InnoDB)에서는 테이블 자체가 기본 키 순서의 클러스터형 인덱스이고, 행 데이터가 이 인덱스에 들어 있습니다. 보조 인덱스의 각 레코드는 인덱스 컬럼과 함께 기본 키 컬럼을 담고, 행 전체를 읽으려면 그 기본 키로 클러스터형 인덱스를 한 번 더 찾습니다. 그래서 기본 키가 길면 모든 보조 인덱스가 커집니다. 반면 PostgreSQL 16은 모든 인덱스가 테이블 힙과 별도로 저장되는 보조 인덱스이고 인덱스 항목이 힙의 행을 가리킵니다. 기본 키도 예외가 아니어서, 기본 키 타입이 다른 인덱스의 크기에 영향을 주지 않습니다.

(공식 문서) MySQL 8.4 매뉴얼 17.6.2.1은 InnoDB 테이블마다 행 데이터를 저장하는 클러스터형 인덱스가 있고 보통 기본 키와 같다고 한다. 기본 키가 없으면 NOT NULL인 첫 UNIQUE 인덱스를 쓰고, 그것도 없으면 숨겨진 `GEN_CLUST_INDEX`를 만든다. 보조 인덱스의 각 레코드는 기본 키 컬럼과 인덱스 컬럼을 담고 InnoDB가 이 기본 키 값으로 클러스터형 인덱스에서 행을 찾으며, 기본 키가 길면 보조 인덱스가 더 많은 공간을 쓰므로 짧은 기본 키가 유리하다고 한다. PostgreSQL 11.9는 PostgreSQL의 모든 인덱스가 테이블의 메인 데이터 영역(힙)과 별도로 저장되는 보조 인덱스이고, 일반 인덱스 스캔은 인덱스와 힙 양쪽에서 읽어야 한다고 한다. 67.4는 B-tree 리프 페이지의 튜플이 테이블 행을 가리킨다고 한다.
(실험 확인) 행 20만 개에 `int` 보조 인덱스 하나를 둔 테이블 두 개를 만들었다. MySQL 8.4.11에서 기본 키가 `bigint`일 때 `PRIMARY` 7.5 MB, 보조 인덱스 6.5 MB였고 `char(36)` UUID일 때는 `PRIMARY` 13.6 MB, 보조 인덱스 16.6 MB였다. PostgreSQL 16.15(기본 키 `bigint`와 `text` UUID)에서는 기본 키 인덱스만 4,408 kB에서 15 MB로 커졌고 보조 인덱스는 둘 다 1,768 kB로 같았다. MySQL에서 `user_id` 보조 인덱스로 `SELECT id, user_id, created_at`을 조회하면 `Extra: Using index`(기본 키가 인덱스에 들어 있으므로 인덱스만으로 충족), `SELECT amount`는 `Using index`가 없었다. 두 DB의 문자열 타입과 문자셋이 달라 DB 사이의 절대 크기를 비교하지는 않는다.
(보충) PostgreSQL에서 기본 키 타입이 다른 인덱스의 크기에 영향을 주지 않는다는 결론은 인덱스가 힙의 행을 가리킨다는 위 문서 설명과 실험(보조 인덱스 크기가 같았음)에서 이끌어 낸 해석이며 문서가 이를 직접 서술하지는 않는다.
