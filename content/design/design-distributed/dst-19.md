---
slug: "dst-19"
topic: "design-distributed"
tier: TRICKY
difficulty: 3
title: "장애 난 서비스에 재시도를 넣었더니 오히려 장애가 커지는 이유는 무엇이고, 어떻게 막나요?"
keywords: ["재시도 증폭(계층별 곱)", "지수 백오프와 지터", "재시도 예산", "모든 원격 호출에 타임아웃", "멱등한 호출만 재시도"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/", "https://sre.google/sre-book/addressing-cascading-failures/", "https://learn.microsoft.com/en-us/azure/architecture/patterns/retry", "https://resilience4j.readme.io/docs/retry", "https://resilience4j.readme.io/docs/timeout"]
concepts: [resilience, idempotency]
importance: 2
links: [{to: "dst-13", kind: PREREQ}, {to: "dst-07", kind: PREREQ}, {to: "dst-22", kind: FOLLOWUP}, {to: "web-09", kind: RELATED}, {to: "web-21", kind: RELATED}]
---
**모범 답변 (30~60초)**
재시도는 일시적 오류를 넘기는 데는 좋지만, 서버가 과부하로 실패하는 중이면 재시도 자체가 부하를 더해 회복을 늦춥니다. 특히 호출 계층이 여러 겹이고 계층마다 재시도하면 시도 횟수가 곱해집니다. 계층 셋이 각각 세 번씩 시도하면 맨 아래 DB는 요청 하나에 27번 호출됩니다. 그래서 모든 원격 호출에 타임아웃을 두고, 재시도는 한 지점에서만 하며 횟수를 제한하고, 지수 백오프에 지터를 섞어 재시도 시점이 한꺼번에 몰리지 않게 하고, 재시도 예산(로컬 토큰 버킷 등)으로 전체 재시도량을 제한합니다. AWS는 Circuit Breaker가 동작 상태를 갈라 테스트가 어렵고 복구를 늦출 수 있다며 토큰 버킷을 권합니다. 부작용이 있는 호출은 멱등할 때만 재시도해야 합니다.

```java
import java.util.*;

public class Retry {
    static int dbCalls = 0;

    static void db() { dbCalls++; throw new IllegalStateException("DB 과부하"); }

    // 계층마다 최대 3번 시도. 아래 계층이 계속 실패하면 위 계층도 다시 부른다.
    static void layer(int depth) {
        for (int attempt = 1; attempt <= 3; attempt++) {
            try { if (depth == 0) db(); else layer(depth - 1); return; }
            catch (IllegalStateException e) { /* 재시도 */ }
        }
        throw new IllegalStateException("포기");
    }

    public static void main(String[] args) {
        try { layer(2); } catch (IllegalStateException e) { }      // 3계층이 각자 재시도
        System.out.println("3계층 각자 3번 시도 -> DB 호출 " + dbCalls + "번");

        Random r = new Random(7);
        long cap = 8000, base = 100;
        for (int attempt = 1; attempt <= 5; attempt++) {
            long ceiling = Math.min(cap, base * (1L << attempt));  // 지수 백오프(상한 포함)
            long jittered = (long) (r.nextDouble() * ceiling);     // full jitter
            System.out.println("재시도 " + attempt + ": 백오프 상한 " + ceiling + "ms, 지터 적용 " + jittered + "ms");
        }
    }
}
```

(공식 문서) AWS Builders' Library의 "Timeouts, retries, and backoff with jitter"는 원격 호출에 연결 타임아웃과 요청 타임아웃을 두라고 하고, 재시도는 "이기적"이어서 장애 원인이 과부하이면 재시도가 부하를 키우고 회복을 지연시킨다고 설명한다. 호출 계층이 다섯 겹이고 계층마다 재시도 3번이면 DB 부하가 243배가 된다는 예를 들며(243은 3의 5제곱이라 계층당 총 3번 시도 기준의 수치이고, 같은 글은 이를 "three retries"로 표현한다. SRE 책은 재시도 3번을 4번 시도로 계산한다), 비용이 낮은 제어·데이터 플레인 작업은 스택의 한 지점에서만 재시도하는 것을 모범으로 삼는다고 한다. 해법으로 지수 백오프(상한 포함), 로컬 토큰 버킷으로 재시도 제한(이 글은 Circuit Breaker가 모달 동작을 만들어 테스트가 어렵고 복구 시간을 늘릴 수 있다고 하며 토큰 버킷을 대안으로 제시한다), 지터(백오프에 무작위성을 더해 재시도를 분산)를 들고, 부작용이 있는 API는 멱등성을 제공해야 재시도해도 안전하며 클라이언트 오류는 같은 요청으로 재시도하지 말아야 하지만 최종 일관성 때문에 그 구분이 흐려지기도 한다고 한다. 타임아웃 값은 하위 서비스 지연 백분위(예: p99.9)를 기준으로 고르는 방법을 소개한다.
(공식 문서) Google SRE 책 "Addressing Cascading Failures"는 순진한 재시도가 백엔드 과부하를 키워 연쇄 장애에 기여했다고 하고, 지수 백오프에 무작위성을 쓰고, 요청당 재시도 횟수를 제한하며, 프로세스 전체 재시도 예산(예: 분당 60회)을 두고, 여러 계층의 재시도를 피하라고 한다(3개 계층이 각각 3번 재시도, 즉 4번 시도하면 DB에 64번). 재시도 가능한 오류와 불가능한 오류를 구분하고 과부하 상태를 명확히 알려 상위가 물러나게 하라고도 한다. Azure Retry 문서도 공격적 재시도가 과부하 서비스를 더 나쁘게 할 수 있고 재시도 정책이 중첩되면 지연이 길어지며 멱등하지 않은 작업은 중복 실행 위험이 있다고 하고, Resilience4j Retry 문서는 `maxAttempts` 기본 3(첫 호출 포함), `waitDuration` 기본 500ms의 고정 대기이며 간격 함수로 백오프를 바꿀 수 있다고 한다. TimeLimiter 문서는 `timeoutDuration`과 실행 중 Future 취소 여부를 설정할 수 있다고 한다.
(실험 확인) 위 코드로 3계층이 각각 최대 3번 시도하고 DB가 계속 실패하자 DB 호출이 27번(3×3×3) 발생했다. 같은 코드의 백오프 계산(기본 100ms, 상한 8000ms, 난수 시드 7)은 시도마다 상한이 200, 400, 800, 1600, 3200ms로 늘고 지터로 그 안의 임의 값(146, 299, 278, 1435, 2266ms)이 나왔다(JDK 25 Corretto 25.0.3). 모의 실험이며 지터 값은 난수 시드에 따른 예시다.
