---
slug: "rpc-15"
topic: "api-rpc"
tier: DEEP
difficulty: 2
title: "GraphQL은 버전 없이 API를 진화시킨다고 하는데, 어떻게 가능하고 주의할 점은 무엇인가요?"
keywords: ["요청한 필드만 반환", "필드 추가는 비파괴", "@deprecated로 폐기 표시", "사용 중단 후 제거", "기본 nullable"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://graphql.org/learn/schema-design/", "https://graphql.org/learn/introduction/", "https://spec.graphql.org/October2021/"]
concepts: [graphql, api-versioning]
importance: 2
links: [{to: "apd-04", kind: RELATED}]
---
**모범 답변 (30~60초)**
엔드포인트 기반 API는 반환 구조를 서버가 정하기 때문에 어떤 변경이든 깨지는 변경이 될 수 있어 새 버전을 만들곤 합니다. GraphQL은 클라이언트가 명시적으로 요청한 데이터만 반환하므로, 새 타입이나 새 필드를 추가해도 기존 클라이언트가 깨지지 않아 버전 없는 API를 유지하는 것이 일반적 관행이라고 공식 자료는 설명합니다. 없앨 필드는 `@deprecated(reason: ...)` 로 표시하고 사용되지 않는다고 판단한 뒤 제거합니다. 스펙도 폐기된 필드를 선택 집합에 넣는 것은 여전히 합법이라고 합니다. 주의할 점은 폐기한 필드도 더 이상 쓰이지 않는다고 판단하기 전까지는 계속 제공해야 한다는 것과, 모든 필드가 기본 nullable이라 non-null 보장은 신중히 정해야 한다는 것입니다.

(공식 문서) Schema Design 페이지는 GraphQL이 지속적 진화 도구로 버전 관리를 피하는 강한 입장이며, 요청된 데이터만 반환하므로 새 타입·새 필드 추가가 깨지는 변경이 아니어서 버전 없는 API가 일반 관행이 됐다고 한다. 또 모든 필드가 기본 nullable이고(장애 시 필드 하나만 null이 되게), non-null 타입은 요청하면 절대 null이 아니라는 보장이며 오류가 나면 부모 필드가 null이 된다고 설명한다. Introduction 페이지는 `@deprecated(reason:)` 예시와 함께 클라이언트 도구가 새 필드 사용을 유도하고 더 이상 쓰이지 않는다고 판단되면 필드를 제거할 수 있다고 한다.
(공식 문서) 스펙(2021년 10월판 3.6.2 Field Deprecation)은 폐기 필드를 선택 집합에 포함하는 것이 여전히 합법이며 문서와 도구에서 적절히 다뤄야 한다고 한다.
