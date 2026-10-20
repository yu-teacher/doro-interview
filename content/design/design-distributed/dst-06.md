---
slug: "dst-06"
topic: "design-distributed"
tier: BASIC
difficulty: 2
title: "서비스마다 DB를 따로 두면 무엇이 좋고, 어떤 문제가 생기나요?"
keywords: ["서비스별 데이터 비공개", "느슨한 결합", "여러 서비스에 걸친 트랜잭션", "조인 쿼리 어려움", "Saga와 CQRS·API 조합"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://microservices.io/patterns/data/database-per-service.html", "https://martinfowler.com/articles/microservices.html", "https://learn.microsoft.com/en-us/azure/architecture/patterns/saga"]
---
**모범 답변 (30~60초)**
서비스마다 자기 데이터를 비공개로 소유하고 다른 서비스는 그 서비스의 API로만 접근하는 방식입니다. 서비스끼리 느슨하게 결합되어 한 서비스의 스키마 변경이 다른 서비스에 번지지 않고, 서비스마다 맞는 종류의 DB를 고를 수 있습니다. 대신 여러 서비스에 걸친 비즈니스 트랜잭션이 단순하지 않고, 여러 서비스의 데이터를 조인하는 조회가 어려우며, 관리할 DB가 늘어납니다. 보통 트랜잭션은 Saga로, 조회는 API 조합이나 CQRS의 조회용 뷰로 풉니다. 이 경우 일관성은 최종 일관성이 되고 실패는 보상 작업으로 처리합니다. 서버를 나누지 않고 스키마나 테이블 단위로 분리하는 방법도 있습니다.

(원저자 자료) Richardson의 microservices.io "Database per service"는 각 서비스의 영속 데이터를 비공개로 두고 서비스 API로만 접근하게 하며, 서비스의 트랜잭션은 자기 DB만 다룬다고 설명한다. 구현 방식으로 테이블 단위, 스키마 단위, DB 서버 단위 분리를 들고, 앞의 둘이 오버헤드가 가장 낮다고 한다. 서비스별 DB 사용자와 권한(grant)으로 우회를 막는 장벽을 두라고 권한다. 장점은 느슨한 결합과 서비스별 최적 DB 선택이고, 단점은 서비스에 걸친 비즈니스 트랜잭션 구현의 어려움, 조인 조회의 어려움, 여러 DB의 관리 복잡도다. 저자는 분산 트랜잭션이 CAP 정리 때문에 피하는 편이 좋고 많은 NoSQL이 지원하지도 않는다고 주장하며, 해법으로 Saga, API Composition, CQRS를 제시한다.
(원저자 자료) Fowler·Lewis는 마이크로서비스가 서비스별 DB를 선호한다고 쓰고, 분산 트랜잭션은 구현이 어렵고 서비스 간 시간적 결합이 크다고 지적한다. 그래서 트랜잭션 없는 조정과 최종 일관성, 보상 작업으로 문제를 다루며, 실수를 고치는 비용이 더 강한 일관성 때문에 잃는 비즈니스보다 작으면 이 거래가 가치 있다고 설명한다.
(공식 문서) Azure Saga 문서도 서비스마다 전용 DB를 두는 구조에서는 ACID 같은 기존 보장이 독립된 여러 저장소에 직접 적용되지 않는다고 설명한다.
