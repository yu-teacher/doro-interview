---
slug: "arc-07"
topic: "design-principles"
tier: DEEP
difficulty: 2
title: "헥사고날 아키텍처(Ports and Adapters)는 무엇이고, 계층형과 무엇이 다른가요?"
keywords: ["안과 밖의 구분", "포트는 목적 있는 대화", "하나의 포트에 여러 어댑터", "UI·DB 없이 테스트"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://alistair.cockburn.us/hexagonal-architecture/", "https://martinfowler.com/bliki/PresentationDomainDataLayering.html", "https://www.domainlanguage.com/ddd/reference/"]
concepts: [layered-architecture]
importance: 2
links: [{to: "arc-03", kind: PREREQ}, {to: "arc-06", kind: PREREQ}, {to: "arc-08", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
헥사고날 아키텍처, 즉 포트와 어댑터는 애플리케이션이 사용자, 다른 프로그램, 자동 테스트, 배치로 똑같이 구동되고 실제 장치나 DB 없이도 개발과 테스트가 되게 하려는 패턴입니다. Alistair Cockburn은 문제의 뿌리를 업무 로직과 외부 상호작용이 뒤엉킨 것으로 보고, 좌우나 위아래가 아니라 안과 밖의 구분에 주목합니다. 포트는 목적 있는 대화를 정의한 API이고, 어댑터는 각 기술의 신호를 포트 호출로 바꿔 주며, 한 포트에 여러 어댑터가 붙을 수 있습니다. 그는 계층 그림은 선이 잘 지켜지지 않아 로직이 새고 포트가 둘보다 많을 수 있다는 점을 한계로 듭니다. 육각형은 6이라는 숫자에 뜻이 있어서가 아닙니다.

```java
interface RateRepository { double rate(long amount); }       // 포트(데이터 쪽 대화)
class DiscountService { DiscountService(RateRepository r) { ... } double discount(long amount) { ... } }
// 같은 포트에 어댑터 둘: DB 대신 메모리 구현으로도 같은 애플리케이션이 돈다
```

(원저자 자료) Alistair Cockburn, "Hexagonal (Ports & Adapters) Architecture"(2005, 원 논문, alistair.cockburn.us). Intent 절은 애플리케이션이 사용자·프로그램·자동 테스트·배치 스크립트에 똑같이 구동되고 런타임 장치·DB와 격리되어 개발·테스트되게 하는 것이라고 한다. Nature of the Solution 절은 두 문제가 모두 비즈니스 로직과 외부 상호작용의 얽힘에서 오고, 안쪽 코드가 바깥으로 새면 안 된다고 하며, 포트는 대화의 목적을 나타내고 프로토콜은 API 형태이며, 외부 장치마다 어댑터가 있고 '메모리 안의 가짜 DB' 어댑터도 같은 포트에 꽂힌다고 한다. 육각형은 포트를 그릴 공간을 위한 것이라고 설명한다. 같은 글 Structure 절의 Figure 3은 같은 애플리케이션을 3계층 그림에 대응시켜 보여 준다.
(원저자 자료) Eric Evans Reference 쪽 10은 Hexagonal Architecture를 격리 목표에 맞는 관련 패턴으로 언급하고, Fowler의 "Presentation Domain Data Layering"은 도메인이 데이터 소스에 의존하지 않게 매퍼를 두는 변형을 흔히 Hexagonal Architecture라 부른다고 적는다.
(실험 확인) JDK 25 `java Hex.java`에서 같은 `DiscountService`가 어댑터만 바꿔(`InMemoryRates`, `FixedRates`) 각각 200.0, 100.0을 반환했다.
