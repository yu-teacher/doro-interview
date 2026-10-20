---
slug: "pat-25"
topic: "design-pattern"
tier: TRICKY
difficulty: 2
title: "디자인 패턴을 많이 적용할수록 좋은 설계인가요? 남용 사례를 들어 보세요."
keywords: ["패턴은 도구이지 목표가 아님", "싱글톤 남용", "옵저버의 흐름 추적 어려움", "if로 충분한 경우", "문제와 의도 기준 선택"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://gameprogrammingpatterns.com/singleton.html", "https://gameprogrammingpatterns.com/observer.html", "https://gameprogrammingpatterns.com/state.html", "https://gameprogrammingpatterns.com/prototype.html", "https://gameprogrammingpatterns.com/design-patterns-revisited.html"]
concepts: [gof-patterns]
importance: 2
---
**모범 답변 (30~60초)**
아니요, 패턴은 문제를 풀 때 쓰는 도구이지 많이 쓸수록 좋은 목표가 아닙니다. 원저자급 자료에서도 경고가 나옵니다. Nystrom은 싱글톤을 쓰지 말아야 할 예로 다루며 득보다 해가 많다고 주장하고, 옵저버는 양쪽을 함께 이해해야 하는 관계에 쓰면 흐름 추적이 어려워진다고 하며, 상태 패턴에 대해서는 때로는 `if` 하나면 충분하다고 말합니다. 프로토타입은 자신이 최선의 답이라고 느낀 사례를 찾지 못했다고도 씁니다. 그래서 패턴 이름이 아니라 해결하려는 문제와 의도를 기준으로 판단해야 합니다.

(원저자 자료) Nystrom, Game Programming Patterns, "Design Patterns Revisited" 소개: 어떤 패턴은 남용되고(싱글톤) 어떤 패턴은 저평가된다(커맨드)고 서술한다. "Singleton" 장은 이 패턴이 GoF가 신중히 쓰라고 강조했음에도 득보다 해를 끼치는 경우가 많다고 한다. "Observer" 장은 통신의 양쪽을 함께 이해해야 하는 관계를 옵저버로 표현하지 말고 더 명시적인 수단을 쓰라는 지침을 준다. "State" 장은 객체지향 마니아들이 모든 분기를 동적 디스패치로 바꾸려 하는 것은 과하고 때로는 `if` 하나면 충분하다고 한다. "Prototype" 장은 자신이 프로토타입 디자인 패턴이 최선이었던 경우를 찾지 못했다고 한다. 모두 게임 개발 맥락에서의 저자 한 사람의 의견·경험이며, 보편적 사실로 단정할 수 없다.
(보충) "패턴은 목표가 아니라 도구이고 문제와 의도를 기준으로 고른다"는 결론은 위 저자 의견들을 종합한 일반적 정리이며, 개별 자료가 그대로 말한 문장은 아니다.
