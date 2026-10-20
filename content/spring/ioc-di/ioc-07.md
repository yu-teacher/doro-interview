---
slug: "ioc-07"
topic: "ioc-di"
tier: BASIC
difficulty: 1
title: "싱글톤 빈은 스레드 안전한가요? 어떻게 설계해야 하나요?"
keywords: ["공유 인스턴스", "stateless", "요청별 상태는 지역변수/파라미터", "상태 있으면 prototype/request", "초기화 후 변경 상태는 volatile/락"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/beans/factory-scopes.html", "https://docs.spring.io/spring-framework/reference/core/beans/factory-nature.html"]
concepts: [bean-lifecycle, race-condition]
importance: 3
links: [{to: "misc-01", kind: RELATED}, {to: "misc-13", kind: RELATED}, {to: "jt-07", kind: RELATED}]
---
**모범 답변 (30~60초)**
컨테이너가 보장하는 것은 싱글톤 인스턴스를 안전하게 게시하는 것까지이고, 스레드 안전한 설계까지 해 주지는 않습니다. 하나의 인스턴스를 여러 요청 스레드가 동시에 공유하기 때문에, 인스턴스 필드에 요청별 상태를 담으면 데이터가 섞입니다. 그래서 싱글톤은 stateless로 설계해야 합니다. 의존성은 final 필드로 두고, 요청별 값은 메서드 파라미터와 지역 변수로 처리합니다. 상태가 꼭 필요하면 그 빈은 prototype이나 request 스코프로 두거나, 초기화 이후 바뀌는 상태는 volatile이나 락으로 보호해야 합니다. 공식 문서도 상태 있는 빈에는 prototype, 상태 없는 빈에는 singleton을 권합니다.

- (공식 문서) 상태 있는 빈은 prototype, 상태 없는 빈은 singleton이라는 권고(스코프 페이지). 라이프사이클 페이지는 컨테이너가 생성된 싱글톤을 싱글톤 락으로 안전하게 게시해 가시성을 보장하므로, 초기화 단계에서만 바뀌는 설정 필드는 volatile이 필요 없다고 한다. 초기화 이후 바뀌는 상태는 volatile이나 공통 락이 필요하고, 초기화와 소멸 사이에 쌓이는 런타임 상태는 스레드 안전한 구조에 두라고 한다. request 스코프 빈은 요청마다 별도 인스턴스라 다른 요청이 상태 변경을 보지 못한다.
- (실험 확인) 상태를 인스턴스 필드에 둔 싱글톤을 두 스레드가 `getBean`으로 얻으면 같은 인스턴스이고, Alice가 `login`한 뒤 Bob이 `login`하면 Alice 스레드의 `whoAmI()`도 Bob을 돌려준다. 반면 요청별 값을 파라미터와 지역 변수로만 다루는 싱글톤은 8개 스레드가 동시에 써도 결과가 섞이지 않는다.

```java
static class StatefulService {
    private String currentUser;                  // 요청별 상태를 필드에 저장 (안티패턴)
    void login(String u) { this.currentUser = u; }
    String whoAmI() { return currentUser; }      // 다른 스레드가 쓴 값을 읽을 수 있다
}
```
