---
slug: "arc-02"
topic: "design-principles"
tier: BASIC
difficulty: 1
title: "개방-폐쇄 원칙(OCP)은 무엇이고, 어떻게 달성하나요?"
keywords: ["수정 없이 확장", "플러그인 구조", "고수준 정책과 저수준 세부 분리", "경계를 넘는 의존성 역전"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://blog.cleancoder.com/uncle-bob/2014/05/12/TheOpenClosedPrinciple.html", "https://blog.cleancoder.com/uncle-bob/2020/10/18/Solid-Relevance.html", "http://butunclebob.com/ArticleS.UncleBob.PrinciplesOfOod"]
---
**모범 답변 (30~60초)**
OCP는 기존 코드를 고치지 않고도 시스템의 동작을 확장할 수 있어야 한다는 원칙입니다. Robert Martin은 Bertrand Meyer의 1988년 정의에서 이 본질을 뽑아 설명하는데, 새 기능을 새 코드 추가만으로 붙일 수 있다면 기존 코드는 다시 컴파일하거나 배포할 필요도 없다는 것입니다. 대표적인 예가 Eclipse 같은 플러그인 시스템이고, 이를 위해 고수준 정책과 저수준 세부를 분리하며 경계를 넘는 의존성의 방향을 뒤집어서 플러그인은 시스템을 알아도 시스템은 플러그인을 모르게 만듭니다. 기능을 추가할 때마다 곳곳을 고치는 샷건 서저리를 피하자는 취지입니다.

(원저자 자료) Robert C. Martin, "The Open Closed Principle"(Clean Code Blog, 2014-05-12). 글은 Meyer의 1988년 `Object Oriented Software Construction` 정의를 소개하되 낡았다고 평하며, 본질을 '시스템을 수정하지 않고 그 동작을 확장할 수 있어야 한다'로 다시 쓴다. 그러면 기능 추가가 새 코드만으로 이뤄지고 기존 코드는 재컴파일·재배포가 필요 없다고 하며, 기능마다 기존 코드를 곳곳에서 고치는 것을 Fowler가 이름 붙인 Shotgun Surgery라고 부른다. 플러그인 시스템이 이 원칙의 증거라고 하며, 고수준 정책과 저수준 세부를 분리하고 경계에서 잘못된 방향의 의존성을 뒤집었기 때문에 가능하다고 설명한다. 이 정의의 문장과 Meyer 원문의 세부는 위 글에 인용된 범위까지만 확인했고 원서 자체는 읽지 않았다.
(원저자 자료) "Solid Relevance"(2020-10-18)는 OCP를 '모듈은 확장에는 열려 있고 수정에는 닫혀 있어야 한다'로 적고, 저자는 이 원칙을 의심하는 시각에 반박하며, GUI·마이크로서비스 통신 프로토콜·DB의 세부로부터 업무 규칙을 격리하자는 취지에서 여전히 유효하다고 주장한다. 짧은 정의 목록은 butunclebob의 "The Principles of OOD"에도 있다(작성 연도는 페이지에서 확인하지 못했고 2005년 댓글이 달려 있다).
