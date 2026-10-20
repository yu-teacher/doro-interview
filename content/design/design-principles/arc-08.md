---
slug: "arc-08"
topic: "design-principles"
tier: DEEP
difficulty: 2
title: "클린 아키텍처의 의존성 규칙은 무엇이고, 안쪽 원이 바깥을 호출해야 할 때는 어떻게 하나요?"
keywords: ["소스 의존은 안쪽으로만", "안쪽은 정책, 바깥은 메커니즘", "출력 포트 인터페이스", "경계를 넘는 단순 데이터 구조"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html"]
---
**모범 답변 (30~60초)**
클린 아키텍처의 핵심은 의존성 규칙으로, 소스 코드 의존성은 오직 안쪽으로만 향해야 한다는 것입니다. 안쪽 원은 정책이고 바깥쪽 원은 메커니즘이며, 안쪽 코드는 바깥 원에서 선언된 이름을 언급하면 안 됩니다. Robert Martin은 엔티티, 유스케이스, 인터페이스 어댑터, 프레임워크와 드라이버의 네 원을 예로 들지만 원이 꼭 네 개일 필요는 없다고 합니다. 유스케이스가 프레젠터를 호출해야 할 때는 안쪽에 출력 포트 인터페이스를 두고 바깥의 프레젠터가 구현하게 하며, 경계를 넘는 데이터는 엔티티나 DB 행이 아니라 단순한 데이터 구조여야 한다고 설명합니다.

(원저자 자료) Robert C. Martin, "The Clean Architecture"(Clean Code Blog, 2012-08-13). 글은 Hexagonal, Onion 등 여러 아키텍처가 세부는 달라도 관심사 분리라는 같은 목표를 가진다고 하고, 프레임워크·UI·DB로부터 독립적이고 테스트 가능하다는 이점을 든다. 'The Dependency Rule' 절은 소스 코드 의존성이 안쪽으로만 향할 수 있고, 안쪽 원이 바깥 원의 함수·클래스·변수 등 어떤 이름도 언급하면 안 된다고 하며, 바깥 원의 프레임워크가 만든 데이터 형식도 안쪽에서 쓰지 말라고 한다. 'Only Four Circles?' 절은 네 개는 도식일 뿐이고 의존성 규칙만 항상 적용된다고 한다. 'What data crosses the boundaries' 절은 단순한 데이터 구조를 넘기고 엔티티나 DB 행을 넘기지 말라고 한다.
