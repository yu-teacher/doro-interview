---
slug: "pat-01"
topic: "design-pattern"
tier: BASIC
difficulty: 1
title: "싱글톤 패턴은 무엇이고, 왜 남용하면 문제가 된다고 하나요?"
keywords: ["인스턴스 하나와 전역 접근", "감춘 전역 변수", "모듈 간 결합", "동시성 문제", "접근 편의만 필요한 경우"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://gameprogrammingpatterns.com/singleton.html", "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Runtime.html"]
concepts: [gof-patterns]
importance: 3
links: [{to: "pat-02", kind: FOLLOWUP}, {to: "pat-03", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
싱글톤은 클래스의 인스턴스를 하나로 제한하면서 그 인스턴스에 전역으로 접근하는 지점을 제공하는 패턴입니다. 다만 Robert Nystrom은 이 패턴이 득보다 해가 많다고 주장합니다. 싱글톤은 클래스 안에 감춘 전역 변수일 뿐이라 코드 추적이 어려워지고, 어디서든 가져다 쓸 수 있어 모듈 간 결합이 쉽게 생기며, 모든 스레드에 노출되어 동시성 버그의 원인이 되기 때문입니다. 또 인스턴스 제한과 전역 접근이라는 두 문제를 한꺼번에 풀기 때문에, 접근 편의만 필요했던 경우에도 나중에 인스턴스를 늘리기 어려워집니다.

(원저자 자료) Nystrom, Game Programming Patterns, "Singleton" 장. 저자는 이 장이 패턴 사용법이 아니라 쓰지 말아야 할 방법을 보여 주는 예외적인 장이라고 밝힌다. 패턴 요약은 GoF의 한 문장(인스턴스를 하나로 보장하고 전역 접근점을 제공)을 인용해 "and"를 기준으로 두 문제로 나누어 논의한다. 후회 요인으로 저자가 드는 것은 전역 변수라는 점(추론 어려움, 결합 유도, 동시성 비친화), 인스턴스 하나만 필요한 것이 아닌데도 두 문제를 함께 푼다는 점, 지연 초기화로 초기화 시점을 통제하기 어렵다는 점이다. 이것은 저자의 주장이며 게임 개발 맥락의 논의다.
(공식 문서) JDK `Runtime` 문서는 모든 자바 애플리케이션에 `Runtime` 인스턴스가 하나 있고 `getRuntime`으로 얻으며 애플리케이션이 직접 만들 수 없다고 설명한다. 문서가 이를 싱글톤 패턴이라고 부르지는 않는다.
