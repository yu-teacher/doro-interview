---
slug: "arc-01"
topic: "design-principles"
tier: BASIC
difficulty: 1
title: "단일 책임 원칙(SRP)은 무엇이고, '책임'은 어떻게 판단하나요?"
keywords: ["변경 이유 하나", "변경을 요청하는 사람", "같은 이유로 바뀌는 것은 모으기", "응집도와 결합도"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://blog.cleancoder.com/uncle-bob/2014/05/08/SingleReponsibilityPrinciple.html", "https://blog.cleancoder.com/uncle-bob/2020/10/18/Solid-Relevance.html"]
concepts: [solid-principles]
importance: 3
links: [{to: "arc-02", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
SRP는 모듈이 바뀌어야 하는 이유가 하나뿐이어야 한다는 원칙입니다. 여기서 이유를 코드가 아니라 사람에게서 찾는 것이 핵심인데, Robert Martin은 변경 요청이 좁은 업무 기능 하나를 대표하는 한 사람 또는 긴밀한 집단에서만 나오도록 모듈을 설계하라고 설명합니다. 예컨대 급여 계산, 근무시간 보고서 형식, DB 저장은 각각 재무·운영·기술 쪽에서 바뀌므로 한 `Employee` 클래스에 같이 두지 않는 쪽으로 설계합니다. 같은 이유로 바뀌는 것은 모으고 다른 이유로 바뀌는 것은 떼어 놓는 일이라서, 응집도는 높이고 결합도는 낮추는 일이기도 합니다.

```java
// 급여 계산(재무), 보고서 형식(운영), 저장(기술)을 변경 이유별로 분리
class PayCalculator { Money calculatePay(long hours, long rate) { return new Money(hours * rate); } }
class HourReporter { String reportHours(String name, long hours) { return name + ": " + hours + "h"; } }
interface EmployeeRepository { void save(String name); }
```

(원저자 자료) Robert C. Martin, "The Single Responsibility Principle"(Clean Code Blog, 2014-05-08). 글은 SRP를 '각 모듈은 변경 이유가 하나여야 한다'로 정의하고, 버그 수정이나 리팩터링은 프로그램이 아니라 프로그래머의 책임이라 변경 이유로 보지 않는다고 설명한다. 이어 `calculatePay`·`reportHours`·`save`를 가진 `Employee` 예에서 각 메서드의 변경 요청이 CFO·COO·CTO 조직에서 나온다고 하며, 저자는 이 원칙이 사람에 관한 것이라고 말한다. 다른 표현으로 '같은 이유로 바뀌는 것은 모으고 다른 이유로 바뀌는 것은 분리하라'를 제시하고, 이것이 응집도와 결합도를 정의하는 또 하나의 방식이라고 한다.
(원저자 자료) 같은 저자의 "Solid Relevance"(2020-10-18)는 같은 문장으로 SRP를 소개하고, 저자는 마이크로서비스도 서로 다른 이유로 바뀌는 코드를 섞으면 얽힌 서비스가 된다고 주장한다.
(실험 확인) 위 분리 구조를 JDK 25 `java Srp.java`로 실행해 각 클래스가 독립적으로 동작함을 확인했다(급여 `Money[won=120000]`, 보고서 `kim: 10h`). 구조가 돌아간다는 확인이며 설계가 옳다는 증명은 아니다.
