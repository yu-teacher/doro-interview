---
slug: "dst-16"
topic: "design-distributed"
tier: DEEP
difficulty: 2
title: "Strangler Fig 패턴으로 레거시 시스템을 어떻게 점진적으로 이전하나요?"
keywords: ["점진적 대체", "앞단 파사드가 라우팅", "이음새(seam) 찾기", "과도기 아키텍처 비용", "전면 재작성 회피"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://martinfowler.com/bliki/StranglerFigApplication.html", "https://learn.microsoft.com/en-us/azure/architecture/patterns/strangler-fig"]
---
**모범 답변 (30~60초)**
Strangler Fig는 레거시 시스템을 한 번에 갈아엎지 않고 기능을 조금씩 새 시스템으로 옮겨 가며 점진적으로 대체하는 방식입니다. 이름은 다른 나무에 붙어 자라다 결국 그 자리를 대체하는 교살자 무화과에서 따왔습니다. Azure 가이드는 클라이언트와 레거시 사이에 파사드(프록시)를 두고 라우팅을 바꿔 가며 일부 요청을 새 서비스로 보내다가, 다 옮기면 레거시를 폐기하고 파사드를 걷어 내거나 레거시 클라이언트용 어댑터로 남긴다고 설명합니다. Fowler는 전면 교체가 기존 동작 파악의 어려움과 긴 개발 기간 때문에 대부분 실패했다고 말합니다. 점진 방식은 위험과 투자를 나누지만 두 시스템이 공존하는 과도기 구조의 비용이 들고, 파사드가 단일 장애점이나 병목이 되지 않게 해야 합니다.

```java
import java.util.*;

public class Strangler {
    static final Set<String> migrated = new LinkedHashSet<>(List.of("/reviews"));   // 새 시스템으로 옮긴 경로

    static String route(String path) {
        return migrated.stream().anyMatch(path::startsWith) ? "새 서비스" : "레거시";
    }

    public static void main(String[] args) {
        for (String p : List.of("/orders/1", "/reviews/9")) System.out.println(p + " -> " + route(p));
        migrated.add("/orders");                       // 기능을 하나 옮긴 뒤 라우팅 규칙만 바꾼다
        for (String p : List.of("/orders/1", "/users/3")) System.out.println(p + " -> " + route(p));
    }
}
```

(원저자 자료) Fowler의 "Strangler Fig"(2024-08-22)는 파사드 라우팅을 직접 다루지 않고 점진적 접근의 취지를 설명하는 글이다. 2001년 호주에서 본 교살자 무화과에서 비유를 얻었고 원래 글 제목이 "Strangler Application"이었다고 밝힌다. 단순 전면 교체는 시간이 오래 걸리고 사용자가 새 기능을 기다릴 수 없으며 기존 동작 파악이 어렵고 불필요한 동작까지 만들게 되어 대부분 실패했다고 쓴다. 대안은 기존 코드 위에 분리된 작은 추가(주로 새 기능)로 시작해 동작을 점차 옮기는 것이며, 시스템을 나눌 이음새(seam)를 찾는 일이 필요하고, 공존을 위한 과도기 아키텍처는 낭비처럼 보여도 위험 감소와 이른 가치 실현이 비용보다 크다고 주장한다. 조직·문화 변화가 없으면 새 시스템도 같은 엉망이 된다고 덧붙인다.
(공식 문서) Azure Strangler Fig 문서는 파사드(프록시)가 요청을 레거시 또는 새 서비스로 라우팅하다가 점차 새 쪽으로 옮기고, 레거시가 더 의존되지 않으면 폐기한 뒤 파사드를 제거하거나 레거시 클라이언트용 어댑터로 남긴다고 설명한다. 두 시스템이 함께 쓰는 서비스와 데이터 저장소 처리, 파사드가 단일 장애점이나 성능 병목이 되지 않게 할 것, 마이그레이션 중 시스템 간 상호 의존 계획을 고려사항으로 든다.
(실험 확인) 위 코드는 `/reviews`만 새 서비스로 옮긴 상태에서 `/orders/1`이 레거시로, `/reviews/9`가 새 서비스로 갔고, 라우팅 규칙에 `/orders`를 추가하자 `/orders/1`만 새 서비스로 바뀌었다(JDK 25 Corretto 25.0.3). 라우팅 규칙을 흉내 낸 것으로 실제 프록시가 아니다.
