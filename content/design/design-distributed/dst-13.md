---
slug: "dst-13"
topic: "design-distributed"
tier: DEEP
difficulty: 2
title: "Circuit Breaker는 어떻게 동작하고 왜 필요한가요?"
keywords: ["CLOSED·OPEN·HALF_OPEN 상태", "실패율 임계값", "빠른 실패로 연쇄 장애 차단", "시험 호출로 복구 확인", "타임아웃 값 설정의 어려움"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://martinfowler.com/bliki/CircuitBreaker.html", "https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker", "https://resilience4j.readme.io/docs/circuitbreaker", "https://microservices.io/patterns/reliability/circuit-breaker.html", "https://docs.spring.io/spring-cloud-circuitbreaker/reference/"]
---
**모범 답변 (30~60초)**
Circuit Breaker는 원격 호출을 감싸 장애가 호출자로 번지는 것을 막는 프록시입니다. 평소에는 닫힘(CLOSED) 상태로 호출을 통과시키며 실패를 세다가, 실패율이나 횟수가 임계값을 넘으면 열림(`OPEN`) 상태가 되어 일정 시간 동안 호출하지 않고 곧바로 실패시킵니다. 응답 없는 서비스를 기다리다 스레드와 연결이 고갈되는 연쇄 장애를 막고, 장애 서비스가 회복할 틈도 줍니다. 대기 시간이 지나면 반열림(`HALF_OPEN`)이 되어 제한된 수의 시험 호출만 보내고, 성공하면 닫히고 실패하면 다시 열립니다. 다만 Richardson은 오탐 없이 지연도 과하지 않게 타임아웃 값을 고르기가 어렵다고 지적합니다.

```java
public class Breaker {
    enum State { CLOSED, OPEN, HALF_OPEN }
    State state = State.CLOSED;
    int failures = 0; long openedAt = 0;
    final int threshold = 3; final long waitMs = 1000;

    String call(long now, boolean backendOk) {
        if (state == State.OPEN) {
            if (now - openedAt < waitMs) return "차단(호출 안 함)";
            state = State.HALF_OPEN;
        }
        if (backendOk) { state = State.CLOSED; failures = 0; return "성공"; }
        failures++;
        if (state == State.HALF_OPEN || failures >= threshold) { state = State.OPEN; openedAt = now; }
        return "실패";
    }

    public static void main(String[] args) {
        Breaker b = new Breaker();
        long[] t = {0, 10, 20, 30, 500, 1100, 1200};
        boolean[] ok = {false, false, false, true, true, true, true};
        for (int i = 0; i < t.length; i++) {
            String r = b.call(t[i], ok[i]);
            System.out.println("t=" + t[i] + " -> " + r + " / " + b.state);
        }
    }
}
```

(원저자 자료) Fowler의 "Circuit Breaker"(2014-03-06)는 Nygard의 책 Release It!이 대중화한 패턴이라고 소개하고, 원격 호출은 멈춰 응답이 없을 수 있어 호출자가 많으면 자원이 고갈되어 연쇄 장애가 난다고 설명한다. 보호 호출을 breaker로 감싸 실패가 임계값에 이르면 breaker가 열려 보호 호출 없이 오류를 즉시 반환하고, 일정 시간 뒤 다시 시도해 성공하면 복구하는 반열림 상태를 둔다고 한다. Richardson은 연속 실패 횟수가 임계값을 넘으면 열리는 것으로 설명하는 반면 Azure·Resilience4j는 일정 기간의 실패 수나 실패율로 설명하는 등 열리는 기준이 자료마다 조금 다르다. Richardson은 이 패턴의 이슈로 오탐을 피하면서 과도한 지연을 만들지 않는 타임아웃 값 선택이 어렵다는 점을 든다.
(공식 문서) Azure Circuit Breaker 문서는 Closed·Open·Half-Open 상태 기계를 설명한다. Closed의 실패 카운터는 일정 시간 안의 실패에만 반응하도록 주기적으로 리셋되고, Half-Open은 제한된 요청만 통과시켜 회복 중인 서비스가 쏟아지는 요청에 다시 쓰러지는 것을 막으며, Retry와는 목적이 달라(재시도는 성공을 기대, breaker는 실패할 작업의 실행을 막음) 함께 쓸 수 있다고 한다. Resilience4j 문서에 따르면 상태는 `CLOSED`·`OPEN`·`HALF_OPEN`과 특수 상태 셋이고, 카운트 기반 또는 시간 기반 슬라이딩 윈도우로 호출 결과를 집계해 실패율이나 느린 호출 비율이 임계값 이상이면 `OPEN`이 되며(기본 `failureRateThreshold` 50%, `slidingWindowSize` 100, `minimumNumberOfCalls` 100, `waitDurationInOpenState` 60초), 최소 호출 수가 모이기 전에는 열리지 않는다. 이 breaker는 동시 실행 수를 제한하지 않아 그것은 Bulkhead의 일이라고 문서가 밝힌다. Spring Cloud Circuit Breaker 문서는 구현체로 Resilience4J, Spring Retry, Framework Retry를 든다.
(실험 확인) 위 코드(임계값 3회, 대기 1000ms의 직접 만든 단순 구현)에서 실패 3번 만에 OPEN이 되었고, 대기 중에는 백엔드가 정상이어도 호출이 차단되었으며, 대기 후 첫 시험 호출이 성공하자 CLOSED로 돌아왔다(JDK 25 Corretto 25.0.3). Resilience4j를 실행한 것은 아니다.
