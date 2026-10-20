---
slug: "pat-09"
topic: "design-pattern"
tier: DEEP
difficulty: 2
title: "상태 패턴은 무엇이고, `enum`과 `switch`로 만드는 방식·전략 패턴과는 무엇이 다른가요?"
keywords: ["상태에 따라 행동 변경", "상태 객체로 위임", "전략과 의도가 다름", "상태 객체 공유", "if나 enum 분기로 충분한 경우"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://gameprogrammingpatterns.com/state.html"]
---
**모범 답변 (30~60초)**
상태 패턴은 객체의 상태에 따라 행동이 바뀌도록, 상태별 동작을 상태 객체에 두고 현재 상태 객체에 위임하는 패턴입니다. 상태를 바꾸는 일은 위임 대상 참조를 다른 상태 객체로 바꾸는 것입니다. Nystrom은 전략이나 타입 객체와 구조가 같지만 의도가 다르다고 합니다. 전략은 주 클래스를 동작 일부에서 떼어 내는 것이 목적이고, 상태는 위임 대상을 갈아 끼워 주 객체의 행동을 바꾸는 것이 목적입니다. 그는 `if`나 `enum` 분기로 충분할 때도 있다고 하며, 상태가 필드를 갖지 않으면 인스턴스 하나를 여러 곳에서 공유할 수 있다고 합니다.

```java
interface State { State handle(String in); String name(); }
static final State STANDING = new State() {
    public State handle(String in) { return in.equals("down") ? DUCKING : this; }
    public String name() { return "standing"; } };
static final State DUCKING = new State() {
    public State handle(String in) { return in.equals("up") ? STANDING : this; }
    public String name() { return "ducking"; } };
static class Hero { State s = STANDING; void input(String in) { s = s.handle(in); } }
```

(원저자 자료) Nystrom, "State" 장: 유한 상태 기계의 상태를 `enum`과 `switch`로 표현하는 방법에서 출발해, 분기가 커지면 상태별 동작을 클래스로 옮기는 GoF 상태 패턴으로 넘어간다. 전략·타입 객체·상태의 차이는 의도(분리 / 공유 / 위임 대상 교체)라고 설명하고, 때로는 `if` 하나로 충분하다고 쓴다. 상태 객체에 인스턴스별 필드가 없으면 정적 인스턴스 하나로 공유할 수 있다고 하며, 이것을 Flyweight 패턴이라고 부른다. 이는 저자의 설계 의견이다.
(실험 확인) `enum`+`switch` 구현과 상태 객체 구현이 같은 전이(standing에서 down을 입력하면 ducking, up을 입력하면 standing)를 냈다. 상태 객체가 필드가 없는 상수일 때 서로 다른 `Hero` 인스턴스가 같은 상태 객체를 가리켰다.
