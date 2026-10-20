---
slug: "dst-20"
topic: "design-distributed"
tier: TRICKY
difficulty: 3
title: "Event Sourcing을 도입할 때 주의할 점은 무엇이고, CQRS와는 어떻게 다른가요?"
keywords: ["이벤트 로그가 원천 데이터", "CQRS와 별개 패턴", "재생 시 외부 시스템 부작용", "이벤트 스키마 변경", "조회가 어려워 CQRS와 함께 사용"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://martinfowler.com/eaaDev/EventSourcing.html", "https://martinfowler.com/articles/201701-event-driven.html", "https://microservices.io/patterns/data/event-sourcing.html"]
---
**모범 답변 (30~60초)**
Event Sourcing은 상태가 바뀔 때마다 그 변화를 이벤트로 기록하고, 현재 상태는 이벤트를 재생해 얻는 방식입니다. 이벤트 로그가 원천 데이터가 되므로 감사 추적, 과거 시점의 상태 복원, 오류 이벤트를 고쳐 재생하는 일이 가능합니다. 하지만 주의점이 많습니다. 재생할 때 외부 시스템에 알림이나 결제 요청이 다시 나가면 안 되어서 게이트웨이로 감싸 재생 중에는 끄는 처리가 필요하고, 이벤트 스키마가 시간이 지나며 바뀌는 문제도 다뤄야 합니다. Richardson은 이벤트 저장소가 질의하기 어려워 CQRS를 함께 써야 한다고 하지만, Fowler는 둘이 별개 패턴이고 필수 조합이 아니라며 어느 쪽이 문제였는지 혼동하기 쉽다고 지적합니다.

```java
import java.util.*;

public class EventSourcing {
    record Event(String type, int amount) {}
    static boolean replaying = false;
    static int emailsSent = 0;

    static int apply(int balance, Event e) {
        int next = e.type().equals("DEPOSIT") ? balance + e.amount() : balance - e.amount();
        if (!replaying && e.type().equals("WITHDRAW")) emailsSent++;   // 외부 시스템(알림) 호출
        return next;
    }

    public static void main(String[] args) {
        List<Event> log = new ArrayList<>();
        int balance = 0;
        for (Event e : List.of(new Event("DEPOSIT", 100), new Event("WITHDRAW", 30), new Event("DEPOSIT", 5))) {
            log.add(e);                                 // 상태 변경은 이벤트 추가로만
            balance = apply(balance, e);
        }
        System.out.println("현재 잔액 " + balance + ", 알림 " + emailsSent + "통");

        int rebuilt = 0;                                // 이벤트 로그만으로 상태 재구성
        for (Event e : log) rebuilt = apply(rebuilt, e);
        System.out.println("재생(가드 없음): 잔액 " + rebuilt + ", 알림 " + emailsSent + "통");   // 알림이 또 나감

        replaying = true;                               // 재생 중에는 외부 호출을 끈다
        emailsSent = 0; rebuilt = 0;
        for (Event e : log) rebuilt = apply(rebuilt, e);
        System.out.println("재생(가드 있음): 잔액 " + rebuilt + ", 알림 " + emailsSent + "통");
    }
}
```

(원저자 자료) Fowler의 "Event Sourcing"(2005-12-12, 이후 갱신하지 않은 초안이라고 저자가 밝힘)은 모든 상태 변경을 이벤트로 캡처해 순서대로 저장하며, 로그로 완전 재구축, 시점 질의, 잘못된 과거 이벤트의 재생을 통한 보정이 가능하다고 설명한다. 외부 시스템 갱신이 까다로운 부분이라서, 재생하면 외부로 갱신 메시지가 또 나가므로 외부 시스템을 게이트웨이로 감싸고 재생 모드에서는 게이트웨이를 끄는 방식을 소개한다. 감사 로그가 얻는 대표적 이점이지만 로그나 감사 기능은 다른 방법으로도 가능하다고 덧붙인다.
(원저자 자료) Fowler의 "What do you mean by Event-Driven?"(2017)은 Event Sourcing이 반드시 비동기일 필요가 없고, 모두가 이벤트 로그를 직접 다룰 필요도 없으며 작업 복사본으로 대부분 처리할 수 있다고 오해를 바로잡는다. 문제로 외부 시스템과의 상호작용이 있는 재생, 시간이 지나며 변하는 이벤트 스키마, 이벤트 처리가 더하는 복잡도를 든다. CQRS는 별개 패턴이며 이벤트와 함께 쓰이는 일이 많지만 필수가 아니고, 한 프로젝트에서 Event Sourcing이 재앙이었다는 말이 실제로는 CQRS나 비동기 통신 문제일 수 있어 패턴 혼동이 문제라고 쓴다. Richardson의 "Event sourcing"은 이점으로 감사 로그, 시점 질의, 이벤트의 신뢰성 있는 발행을, 단점으로 학습 곡선과 이벤트 저장소 질의의 어려움(그래서 CQRS 필요, 따라서 최종 일관성)을 든다.
(실험 확인) 위 코드는 이벤트 3개로 잔액 75를 만들고, 인출 이벤트마다 알림을 보내게 했을 때 가드 없이 재생하면 알림이 또 나갔고(1통에서 2통), 재생 중 외부 호출을 끄면 같은 잔액 75에 알림 0통이었다(JDK 25 Corretto 25.0.3). 게이트웨이를 불리언 플래그로 흉내 낸 단순 모의다.
