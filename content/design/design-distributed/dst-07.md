---
slug: "dst-07"
topic: "design-distributed"
tier: BASIC
difficulty: 2
title: "멱등성이란 무엇이고, 메시지가 중복으로 도착하면 어떻게 처리하나요?"
keywords: ["같은 요청을 여러 번 해도 한 번과 같은 결과", "at-least-once 전달", "처리한 메시지 ID 기록", "기본 키 충돌로 중복 감지", "자연스러운 멱등성"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://microservices.io/patterns/communication-style/idempotent-consumer.html", "https://www.enterpriseintegrationpatterns.com/patterns/messaging/IdempotentReceiver.html", "https://www.cidrdb.org/cidr2007/papers/cidr07p15.pdf", "https://www.cl.cam.ac.uk/teaching/2122/ConcDisSys/dist-sys-notes.pdf"]
concepts: [idempotency, messaging]
importance: 3
links: [{to: "dst-11", kind: FOLLOWUP}, {to: "dst-21", kind: FOLLOWUP}, {to: "dst-22", kind: FOLLOWUP}, {to: "web-01", kind: RELATED}, {to: "web-21", kind: RELATED}]
---
**모범 답변 (30~60초)**
멱등성은 같은 요청이나 메시지를 여러 번 처리해도 한 번 처리한 것과 결과가 같은 성질입니다. 메시지를 잃지 않으려고 at-least-once 전달을 쓰는 시스템이 많은데, 이 경우 처리 후 확인(ack) 전에 죽으면 같은 메시지가 다시 전달되고 네트워크 재시도도 있어서 중복은 정상 동작의 일부입니다. 그래서 소비자는 멱등해야 합니다. 가장 흔한 방법은 처리한 메시지 ID를 DB에 기록하는 것으로, 메시지를 처리하는 트랜잭션 안에서 ID를 처리 이력 테이블에 넣고, 기본 키 충돌로 insert가 실패하면 이미 처리한 메시지라고 보고 무시합니다. 조회처럼 원래 멱등한 연산은 별도 장치가 필요 없습니다.

```java
import java.util.*;

public class Idem {
    static int balance = 100;
    static final Set<String> processed = new HashSet<>();   // PROCESSED_MESSAGES(message_id PK) 역할

    static void onDebited(String messageId, int amount) {
        if (!processed.add(messageId)) {                    // PK 충돌 = 이미 처리한 메시지
            System.out.println("중복 무시 " + messageId);
            return;
        }
        balance -= amount;
    }

    public static void main(String[] args) {
        onDebited("m-1", 30);
        onDebited("m-1", 30);   // 브로커가 같은 메시지를 다시 전달
        onDebited("m-2", 20);
        System.out.println("잔액 " + balance);   // 50 이어야 함 (중복 처리했다면 20)
    }
}
```

(원저자 자료) Richardson의 "Idempotent Consumer"는 소비자를 같은 메시지를 반복 처리해도 한 번 처리한 것과 결과가 같게 만들라고 하고, 처리한 메시지 ID를 DB의 별도 테이블이나 업무 엔티티에 기록하는 방법을 든다. 처리 트랜잭션 시작 후 ID를 넣고, (구독자, 메시지 ID) 기본 키 때문에 insert가 실패하면 롤백하고 메시지를 무시한다고 설명한다. EIP 사이트의 Idempotent Receiver 요약은 발신자가 한 번만 보내도 수신자는 여러 번 받을 수 있다고 하고, 중복 제거(de-duping)나 메시지 의미 자체를 멱등하게 정의하는 두 가지 방법을 든다(전문은 책이라 읽지 못했고 사이트의 요약만 근거로 한다). Helland의 CIDR 2007 논문(PDF 3~4쪽, 8쪽)은 응용 프로그램이 메시지를 처리하고 DB를 갱신한 뒤 ack하는 구조에서는 실패 구간에 메시지가 두 번 전달될 수 있다고 하며, 읽기만 하는 메시지는 자연스럽게 멱등하고 실질적 변경이 있는 메시지는 처리 사실을 상태로 기억해야 한다고 설명한다. Kleppmann의 Cambridge 강의 노트(PDF 48쪽)는 멱등을 f(x)=f(f(x))로 정의하고, 카운터 증가는 멱등이 아니지만 집합에 원소를 넣는 것은 멱등이라고 예를 든다.
(실험 확인) 위 코드로 같은 ID `m-1`을 두 번 전달하자 두 번째는 무시되고 잔액이 50으로 나왔다(JDK 25 Corretto 25.0.3). 이 실험은 메모리 집합으로 기본 키 충돌을 흉내 낸 것이다.
