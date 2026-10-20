---
slug: "dst-22"
topic: "design-distributed"
tier: TRICKY
difficulty: 3
title: "멱등한 연산이면 재시도는 항상 안전한가요?"
keywords: ["멱등과 인과적 안전은 다름", "재시도 사이에 끼어든 다른 클라이언트의 변경", "카운터 증가는 멱등 아님", "집합에 추가는 멱등", "타임스탬프로 오래된 재시도가 덮어쓰기를 막음"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.cl.cam.ac.uk/teaching/2122/ConcDisSys/dist-sys-notes.pdf"]
concepts: [idempotency]
importance: 1
links: [{to: "dst-07", kind: PREREQ}, {to: "web-17", kind: RELATED}]
refs: ["Kleppmann, Distributed Systems lecture notes (Cambridge, 2021/22), 멱등성, PDF pp.48~50"]
---
**모범 답변 (30~60초)**
아닙니다. 멱등은 같은 연산을 반복해도 결과가 같다는 성질로, 카운터 증가는 멱등이 아니고 집합에 원소를 넣는 것은 멱등입니다. 하지만 재시도 사이에 다른 클라이언트의 연산이 끼어들면 안전하지 않을 수 있습니다. 클라이언트 1이 좋아요를 추가했는데 응답이 유실되고, 클라이언트 2가 그 좋아요를 보고 취소했습니다. 이때 클라이언트 1이 재시도하면 집합에 원소를 넣는 연산은 멱등이지만, 취소된 좋아요가 되살아납니다. 취소는 추가를 본 뒤에 일어났으니 인과적으로 나중이어서 최종 상태에 좋아요가 없어야 하는데, 오래된 재시도가 그 결과를 덮어쓰기 때문입니다. 그래서 재시도 안전성을 말할 때는 멱등성뿐 아니라 다른 연산과의 순서와 인과 관계를 함께 따져야 합니다. 강의 노트는 갱신마다 논리적 타임스탬프를 붙이면 재시도가 같은 타임스탬프를 가져 더 나중 타임스탬프의 쓰기를 덮어쓰지 못한다고 설명합니다.

```java
import java.util.*;

public class IdemLimit {
    public static void main(String[] args) {
        Set<String> likes = new HashSet<>();
        likes.add("alice");                  // client1: 좋아요 추가 (응답은 유실)
        likes.remove("alice");               // client2: 같은 좋아요를 보고 취소
        likes.add("alice");                  // client1: 응답을 못 받아 재시도 (add 는 멱등)
        System.out.println(likes);           // [alice] -- 취소가 되살아남
    }
}
```

(원저자 자료) Kleppmann의 Cambridge 분산 시스템 강의 노트(2021/22, PDF 48~50쪽)는 좋아요 예시로 이 문제를 설명한다. 멱등을 f(x)=f(f(x))로 정의하고 카운터 증가는 멱등이 아니지만 집합에 원소를 넣는 것은 멱등이라고 한다. 재시도 정책을 at-most-once(재시도 안 함, 갱신이 누락될 수 있음), at-least-once(확인될 때까지 재시도, 갱신이 반복될 수 있음), exactly-once(재시도에 멱등성 또는 중복 제거)로 나눈다. 그러나 멱등에는 한계가 있어, 클라이언트 1의 추가 응답이 유실되고 클라이언트 2가 그 결과를 읽고 제거한 뒤 클라이언트 1이 재시도하면 사용자 ID가 집합에 다시 들어간다고 설명한다. 2의 제거가 인과적으로 나중인데도 f(g(f(x)))가 g(f(x))와 달라지므로, 이 경우 집합 추가가 멱등이라는 사실만으로는 재시도가 안전하지 않다고 한다. 이를 막는 방법으로 갱신마다 논리적 타임스탬프를 붙이고 오래된 쪽을 버리는 방식을 소개하며(재시도는 원래 요청과 같은 타임스탬프를 가지므로 더 나중 타임스탬프의 쓰기를 덮어쓰지 못한다고 설명), 일반적인 요청 중복 제거는 크래시 복구 모델에서 요청(또는 메타데이터)을 안정 저장소에 기록해야 정확하다고도 쓴다(48쪽).
(실험 확인) 위 코드는 추가, 취소, 재시도 추가를 차례로 실행한 결과 집합이 `[alice]`로 취소가 사라졌다(JDK 25 Corretto 25.0.3). 강의 노트의 시나리오를 단일 스레드로 순서대로 재현한 것이다.
