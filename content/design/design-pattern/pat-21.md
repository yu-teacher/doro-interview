---
slug: "pat-21"
topic: "design-pattern"
tier: DEEP
difficulty: 2
title: "커맨드 패턴은 무엇이고 언제 유용한가요? `Runnable`과는 어떤 관계인가요?"
keywords: ["메서드 호출을 객체로", "큐잉과 지연 실행", "undo·redo", "콜백의 객체지향 대체", "Runnable과 Executor"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://gameprogrammingpatterns.com/command.html", "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/Executor.html", "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Runnable.html"]
---
**모범 답변 (30~60초)**
Nystrom은 커맨드를 메서드 호출을 객체로 만든 "reified method call"이라고 요약하고, GoF가 커맨드를 콜백의 객체지향적 대체라고도 했다고 소개합니다. 호출이 객체가 되면 변수에 담고, 큐에 쌓았다 나중에 실행하고, 기록할 수 있으며, 실행의 반대 연산인 `undo()`를 추가해 되돌리기를 만들 수 있습니다. JDK에서는 `Runnable` 작업을 `Executor`에 제출해 작업 제출과 실행 방식을 분리하는 모양이 비슷하지만, `Runnable`에는 `undo`가 없으므로 되돌리기가 필요하면 별도의 커맨드 인터페이스를 설계해야 합니다.

```java
interface Command { void execute(); void undo(); }
static class Move implements Command {
    final Unit u; final int dx; int before;
    Move(Unit u, int dx) { this.u = u; this.dx = dx; }
    public void execute() { before = u.x; u.x += dx; }
    public void undo() { u.x = before; }
}
```

(원저자 자료) Nystrom, "Command" 장: 커맨드는 메서드 호출을 객체로 감싼 것이며, 콜백·일급 함수·클로저와 같은 계열이지만 GoF가 말했듯 객체지향적 대체라고 한다. 활용 예로 입력 설정(키와 동작 분리), 액터에 대한 명령 분리, 되돌리기와 다시 실행을 든다. 되돌리기를 위해 각 커맨드에 `undo()`를 두고 실행 직전 상태를 기억하며, 실행한 커맨드를 목록에 쌓아 여러 단계 되돌리기를 구현한다. 책임 연쇄와 플라이웨이트와의 관계도 짧게 언급한다.
(공식 문서) `Executor` API 문서는 제출된 `Runnable` 작업을 실행하는 객체로서 작업 제출과 스레드 사용·스케줄링 같은 실행 방식을 분리한다고 하고, `Runnable`은 결과를 반환하지 않는 연산을 나타내는 함수형 인터페이스라고 한다.
(실험 확인) 커맨드 두 개(이동 +3, +4)를 큐에 넣고 나중에 실행하자 위치가 0에서 7이 되었고, 기록해 둔 커맨드를 거꾸로 `undo`하자 3, 0이 되었다. 람다로 만든 `Runnable`은 실행만 가능했다.
(보충) `Runnable`/`Executor`를 커맨드 패턴이라고 부르는 JDK 문서는 읽지 못했고, 위 대응은 해석이다.
