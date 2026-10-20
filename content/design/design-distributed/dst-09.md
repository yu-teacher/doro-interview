---
slug: "dst-09"
topic: "design-distributed"
tier: DEEP
difficulty: 2
title: "Saga 패턴은 무엇이고, 왜 필요하며, 보상 트랜잭션은 어떻게 동작하나요?"
keywords: ["로컬 트랜잭션의 연속", "보상 트랜잭션", "분산 트랜잭션 회피", "완료된 단계를 역순으로 취소", "의미상 되돌리기"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://microservices.io/patterns/data/saga.html", "https://learn.microsoft.com/en-us/azure/architecture/patterns/saga", "https://www.cs.cornell.edu/andru/cs711/2002fa/reading/sagas.pdf"]
concepts: [distributed-consistency, idempotency]
importance: 3
links: [{to: "dst-10", kind: FOLLOWUP}, {to: "dst-11", kind: FOLLOWUP}, {to: "dst-24", kind: FOLLOWUP}, {to: "dbt-14", kind: RELATED}]
refs: ["Garcia-Molina, Salem, Sagas (1987), PDF p.2 (논문 p.250)"]
---
**모범 답변 (30~60초)**
Saga는 여러 서비스에 걸친 비즈니스 트랜잭션을 서비스별 로컬 트랜잭션의 연속으로 쪼개는 방식입니다. 각 단계는 자기 DB에서 원자적으로 커밋되고 다음 단계를 이벤트나 메시지로 이어 갑니다. 중간 단계가 비즈니스 규칙 위반 등으로 실패하면 이미 끝난 단계들을 역순으로 보상 트랜잭션을 실행해 되돌립니다. 보상은 DB 롤백이 아니라 주문 취소, 재고 복원처럼 의미상 되돌리는 별도 트랜잭션이라서 개발자가 직접 설계해야 합니다. 서비스마다 DB가 따로여서 2PC 같은 분산 트랜잭션을 쓰기 어려울 때의 대안이고, 단계 사이의 중간 상태가 다른 트랜잭션에 보일 수 있다는 점은 감수해야 합니다.

```java
import java.util.*;

public class Saga {
    record Step(String name, Runnable action, Runnable compensation) {}

    public static void main(String[] args) {
        List<Step> steps = List.of(
            new Step("주문 생성", () -> System.out.println("주문 PENDING"), () -> System.out.println("  보상: 주문 취소")),
            new Step("재고 예약", () -> System.out.println("재고 예약"), () -> System.out.println("  보상: 재고 복원")),
            new Step("결제", () -> { throw new IllegalStateException("한도 초과"); }, () -> System.out.println("  보상: 결제 취소")));

        Deque<Step> done = new ArrayDeque<>();
        try {
            for (Step s : steps) { s.action().run(); done.push(s); }
        } catch (RuntimeException e) {
            System.out.println("실패: " + e.getMessage());
            while (!done.isEmpty()) done.pop().compensation().run();   // 완료된 단계만, 역순으로 보상
        }
    }
}
```

(원저자 자료) Richardson의 microservices.io "Saga"는 saga를 안정적으로 조정되는 로컬 트랜잭션의 연속으로 정의한다. 조정 장치가 saga를 끝까지 진행시키며, 비즈니스 규칙 위반으로 로컬 트랜잭션이 실패하면 이미 완료된 변경을 보상 트랜잭션으로 취소한다고 설명한다. 단점으로 자동 롤백이 없어 보상을 직접 설계해야 한다는 것, 격리(ACID의 I)가 없어 동시 실행 시 데이터 이상이 생길 수 있다는 것을 든다.
(공식 문서) Azure Saga 문서는 보상 가능 트랜잭션, 이를 넘어서면 되돌릴 수 없는 분기점인 pivot 트랜잭션, 그 뒤의 재시도 가능(멱등) 트랜잭션이라는 개념을 설명하고, 보상 트랜잭션도 항상 성공하지는 않아 불일치가 남을 수 있다고 경고한다.
(원저자 자료) Garcia-Molina·Salem의 "Sagas"(1987, PDF 2쪽=논문 250쪽)는 원래 오래 걸리는 트랜잭션(LLT)이 락을 오래 쥐어 다른 트랜잭션을 막는 문제를 줄이려고 제안되었다. saga를 서로 끼어들 수 있는 하위 트랜잭션 T1~Tn의 열로 보고, 각 Ti에 보상 트랜잭션 Ci를 두어 T1…Tn이 모두 실행되거나 T1…Tj, Cj…C1이 실행됨을 보장한다고 쓴다. 보상은 Ti의 효과를 의미상 취소할 뿐 DB를 Ti 시작 전 상태로 돌려놓는 것은 아니며(중간에 다른 트랜잭션이 바꿨을 수 있어서), 다른 트랜잭션이 부분 실행 결과를 볼 수 있다고 명시한다(스캔한 PDF의 텍스트 추출본에서 확인). 다만 이 논문의 saga는 단일 DBMS 안에서 장기 트랜잭션의 락 문제를 줄이는 메커니즘으로 논의된 것이고(논문이 분산 DB 구현은 짧게만 언급한다고 밝힌다), 서비스 간 일관성 용도로 쓰는 것은 Richardson과 Azure 문서의 설명이므로 자료마다 saga의 맥락이 다르다.
(실험 확인) 위 코드는 주문 생성과 재고 예약이 끝난 뒤 결제가 실패하면 재고 복원, 주문 취소 보상이 역순으로 실행되고 실패한 결제 단계의 보상은 실행되지 않음을 보였다(JDK 25 Corretto 25.0.3). 단일 JVM 안의 흉내이며 메시지 전달과 영속화는 다루지 않는다.
