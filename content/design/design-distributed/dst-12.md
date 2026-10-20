---
slug: "dst-12"
topic: "design-distributed"
tier: DEEP
difficulty: 2
title: "CQRS란 무엇이고 언제 쓰나요? 쓰면 어떤 문제가 생기나요?"
keywords: ["명령 모델과 조회 모델 분리", "이벤트로 갱신하는 조회용 뷰", "최종 일관성", "복잡도 증가", "바운디드 컨텍스트 일부에만 적용"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://martinfowler.com/bliki/CQRS.html", "https://martinfowler.com/articles/201701-event-driven.html", "https://microservices.io/patterns/data/cqrs.html"]
concepts: [distributed-consistency]
importance: 2
links: [{to: "dst-20", kind: FOLLOWUP}, {to: "dst-06", kind: PREREQ}]
---
**모범 답변 (30~60초)**
CQRS는 정보를 갱신하는 모델과 읽는 모델을 분리하는 패턴입니다. 갱신은 명령 모델이 맡고 조회는 조회에 맞게 만든 별도 모델이 맡는데, Fowler는 두 모델이 같은 DB를 쓸 수도 있다고 하고, Richardson은 서비스가 발행한 이벤트를 구독해 갱신하는 읽기 전용 뷰 DB로 설명합니다. 복잡한 도메인이거나 읽기와 쓰기 부하 차이가 커서 따로 확장하고 싶을 때 이점이 있고, 서비스별 DB에서 여러 서비스 데이터를 조인하는 조회를 푸는 방법이기도 합니다. 하지만 Fowler는 대부분의 시스템에서 위험한 복잡도만 더한다고 경고하며 시스템 전체가 아니라 바운디드 컨텍스트 일부에만 쓰라고 합니다. 모델이 분리되면 일관성 유지가 문제라 최종 일관성이 쓰일 가능성이 큽니다.

```java
import java.util.*;

public class Cqrs {
    static final Map<String, Integer> writeModel = new HashMap<>();     // 명령 쪽 저장소
    static final Map<String, Integer> readModel = new HashMap<>();      // 조회용 뷰
    static final Deque<String> eventQueue = new ArrayDeque<>();         // 도메인 이벤트

    static void placeOrder(String user) {                               // 명령
        writeModel.merge(user, 1, Integer::sum);
        eventQueue.add(user);                                           // 뷰 갱신은 나중에
    }
    static void projectOne() {                                          // 이벤트 구독자가 뷰를 갱신
        String u = eventQueue.poll();
        if (u != null) readModel.merge(u, 1, Integer::sum);
    }

    public static void main(String[] args) {
        placeOrder("kim");
        System.out.println("명령 직후 조회: " + readModel.getOrDefault("kim", 0));   // 0 (아직 반영 전)
        projectOne();
        System.out.println("반영 후 조회:   " + readModel.getOrDefault("kim", 0));   // 1
    }
}
```

(원저자 자료) Fowler의 "CQRS"(2011-07-14)는 Greg Young이 설명한 패턴이라고 소개하고, 갱신용 모델과 조회용 모델을 나누며 두 모델이 같은 DB를 쓰거나 따로 DB를 가질 수 있다고 설명한다. 별도 모델 사이에는 일관성 유지 문제가 생겨 최종 일관성이 쓰일 가능성이 높아진다고 쓴다. 이점은 복잡한 일부 도메인과 읽기·쓰기 부하의 독립적 확장이며, 저자는 성공 사례도 봤지만 자신이 접한 사례는 대다수가 좋지 않았고 CQRS가 시스템을 심각한 곤란에 빠뜨리는 요인으로 보인 경우가 많았다고 자신의 경험을 말한다. 또 시스템 전체가 아니라 바운디드 컨텍스트 일부에만 쓰라고 주장하고, 까다로운 조회만 문제라면 리포팅 DB로 충분할 수 있다고 한다.
(원저자 자료) Fowler의 "What do you mean by Event-Driven?"(2017)는 CQRS가 엄밀히는 이벤트와 무관하며 이벤트 없이도 쓸 수 있고, 동료 다수가 오남용을 경계한다고 쓴다. Richardson의 "CQRS"는 서비스별 DB 구조에서 여러 서비스에 걸친 조회를 위해 서비스가 발행한 도메인 이벤트를 구독해 갱신하는 읽기 전용 뷰 DB를 정의하고, 이점으로 확장 가능한 비정규화 뷰와 관심사 분리를, 단점으로 복잡도 증가·코드 중복·복제 지연으로 인한 최종 일관성을 든다.
(실험 확인) 위 코드는 명령 직후 조회 모델이 0이었다가 이벤트를 하나 반영한 뒤 1이 되는 지연을 보였다(JDK 25 Corretto 25.0.3). 메모리 모의 실험이다.
