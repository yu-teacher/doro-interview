---
slug: "dst-11"
topic: "design-distributed"
tier: DEEP
difficulty: 2
title: "DB 갱신과 메시지 발행을 원자적으로 하려면 어떻게 하나요? (Transactional Outbox)"
keywords: ["이중 쓰기 문제", "같은 트랜잭션에 outbox 테이블 기록", "메시지 릴레이", "중복 발행 가능", "소비자 멱등성"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://microservices.io/patterns/data/transactional-outbox.html", "https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html", "https://docs.spring.io/spring-modulith/reference/events.html"]
concepts: [distributed-consistency, messaging]
importance: 2
links: [{to: "dst-07", kind: PREREQ}, {to: "dst-21", kind: FOLLOWUP}, {to: "tx-19", kind: RELATED}]
---
**모범 답변 (30~60초)**
서비스가 DB를 갱신하면서 메시지도 브로커로 보내야 할 때 2PC로 둘을 묶기가 현실적이지 않아 생기는 이중 쓰기 문제가 있습니다. 커밋 전에 보내면 롤백됐는데 메시지가 나가고, 커밋 후에 보내면 그 사이에 죽어서 메시지를 잃습니다. Transactional Outbox는 비즈니스 데이터를 바꾸는 같은 로컬 트랜잭션 안에서 보낼 메시지를 outbox 테이블에 함께 저장하고, 메시지 릴레이라는 별도 프로세스가 그 테이블을 읽어 브로커에 발행하는 방식입니다. 메시지는 커밋된 경우에만 나가고 순서도 지킬 수 있습니다. 다만 릴레이가 발행 후 표시 전에 죽으면 같은 메시지를 다시 보내므로 소비자는 멱등해야 합니다.

```java
import java.util.*;

public class Outbox {
    static final List<String> orders = new ArrayList<>(), outbox = new ArrayList<>(), broker = new ArrayList<>();
    static int relayed = 0;                         // 릴레이가 '발행 완료'로 기록한 위치

    static void placeOrder(String id, boolean fail) {
        try {                                       // 하나의 로컬 트랜잭션
            orders.add(id);
            outbox.add("OrderCreated:" + id);
            if (fail) throw new RuntimeException("커밋 전 실패");
        } catch (RuntimeException e) {              // 롤백: 주문과 아웃박스 행이 함께 사라진다
            orders.remove(id);
            outbox.remove("OrderCreated:" + id);
        }
    }

    static void relay(boolean crashBeforeMark) {
        for (int i = relayed; i < outbox.size(); i++) {
            broker.add(outbox.get(i));              // 브로커로 발행
            if (crashBeforeMark) return;            // 발행 후, 기록 전에 죽음
            relayed = i + 1;
        }
    }

    public static void main(String[] args) {
        placeOrder("A", false);
        placeOrder("B", true);                      // 롤백되어 메시지도 없다
        relay(true);                                // 크래시
        relay(false);                               // 재시작 후 다시 발행
        System.out.println("주문=" + orders + ", 아웃박스=" + outbox + ", 브로커=" + broker);
        System.out.println("소비자가 중복 제거 후 처리: " + new LinkedHashSet<>(broker).size() + "건");
    }
}
```

(원저자 자료) Richardson의 "Transactional outbox"는 DB와 메시지 브로커에 걸친 2PC가 가능하지 않거나 바람직하지 않다는 전제에서, 메시지를 비즈니스 엔티티를 갱신하는 트랜잭션의 일부로 DB(outbox 테이블)에 저장하고 별도 릴레이가 브로커로 보내게 한다. 장점은 2PC가 필요 없고, 메시지가 DB 트랜잭션이 커밋될 때에만 보내지며 애플리케이션이 보낸 순서대로 전달된다는 것이다. 단점으로 개발자가 발행을 잊기 쉽다는 점을 들고, 릴레이가 발행 후 기록 전에 죽어 재시작 후 다시 발행할 수 있으므로 소비자는 처리한 메시지 ID를 추적하는 등으로 멱등해야 한다고 쓴다. 릴레이 구현은 트랜잭션 로그 테일링과 폴링 퍼블리셔 두 가지를 든다.
(공식 문서) AWS Prescriptive Guidance의 "Transactional outbox pattern"은 DB 쓰기와 메시지 알림이 함께 있는 이중 쓰기 문제를 설명하고, outbox 테이블이나 변경 데이터 캡처(CDC)로 풀며, 중복 메시지·알림 순서·롤백 시 미발송을 주의점으로 든다. Spring Modulith 문서의 이벤트 퍼블리케이션 레지스트리(애플리케이션 모듈 간 이벤트 기능이며 서비스 간 outbox 그 자체로 소개된 것은 아니다)는 이벤트 발행 시 트랜잭션 이벤트 리스너마다 항목을 원래 비즈니스 트랜잭션 안에서 로그에 기록하고, 리스너가 성공하면 완료 표시를 하며 실패하면 항목이 남아 재시도할 수 있다고 한다. 같은 문서는 기본 이벤트 외부화는 실용적이지만 실제 outbox 구현이 갖는 핵심 기능이 부족하며, 2.1부터 Namastack Outbox와 JobRunr 위임을 지원한다고 밝힌다.
(실험 확인) 위 코드로 실패(롤백)한 주문 B는 주문과 아웃박스에서 함께 사라졌고, 릴레이가 발행 후 표시 전에 죽었다가 다시 돌면 브로커에 같은 메시지 A가 두 번 쌓였으며, 소비자가 중복을 제거하면 처리는 1건이었다(JDK 25 Corretto 25.0.3). 이 실험은 리스트로 트랜잭션을 흉내 낸 모의이며 실제 DB 트랜잭션이나 브로커를 쓰지 않았다.
