---
slug: "misc-01"
topic: "spring-misc"
tier: BASIC
difficulty: 1
title: "싱글톤 빈은 왜 stateless 하고 thread-safe 해야 하나요?"
keywords: ["싱글톤 스코프", "공유 인스턴스", "가변 필드 금지", "생성자 주입 + final", "지역 변수", "요청별 상태"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/beans/factory-scopes.html"]
concepts: [bean-lifecycle, race-condition]
importance: 3
links: [{to: "misc-13", kind: FOLLOWUP}, {to: "ioc-07", kind: RELATED}, {to: "ioc-06", kind: RELATED}, {to: "pat-02", kind: RELATED}]
---
**모범 답변 (30~60초)**
스프링 빈의 기본 스코프는 싱글톤이라서 컨테이너 안에 빈 정의당 인스턴스가 딱 하나만 만들어지고, 동시에 들어온 요청을 처리하는 여러 스레드가 그 하나를 같이 씁니다. 그래서 서비스에 `private int count` 같은 가변 필드가 있으면 요청 간에 값이 섞이고, 한 사용자의 데이터가 다른 사용자에게 보이는 사고까지 날 수 있습니다. 공식 문서도 상태가 있는 빈은 프로토타입, 상태가 없는 빈은 싱글톤으로 쓰라고 안내합니다. 그래서 생성자 주입한 `final` 필드에는 repository 같은 불변 의존성만 두고, 요청별 상태는 지역 변수나 파라미터, 반환값으로만 다룹니다. 꼭 필요하면 `AtomicLong` 같은 동시성 도구를 쓰거나 request 스코프로 분리합니다.

```java
@Service
public class BadCounterService {
    private int count;                 // 모든 요청 스레드가 공유 -> race condition
    public int next() { return ++count; }   // ++ 는 원자적이지 않다
}
```

(공식 문서, 빈 스코프 절) 싱글톤 스코프는 기본 스코프이며, 컨테이너는 빈 정의당 인스턴스를 정확히 하나 만들어 캐시하고 이후의 모든 요청에 그 객체를 돌려준다. GoF 싱글톤(클래스로더당 하나)과 달리 "컨테이너 단위·빈 단위"의 싱글톤이다. 문서는 "상태가 있는 빈에는 프로토타입, 상태가 없는 빈에는 싱글톤을 쓰는 것이 원칙"이라고 적는다. request 스코프는 HTTP 요청마다 새 인스턴스를 만들어서, 인스턴스의 상태를 바꿔도 다른 요청에는 보이지 않고 요청이 끝나면 버려진다. 주의할 점도 문서에 있다. 프로토타입 빈을 싱글톤에 주입하면 주입 시점에 한 번 만들어진 그 인스턴스만 계속 쓰이고, 요청 스코프 빈처럼 수명이 짧은 빈을 싱글톤에 넣으려면 스코프 프록시를 주입해야 한다.

(보충) 싱글톤이 thread-safe 를 "보장"해 주는 것은 아니다. 컨테이너는 인스턴스를 하나 만들어 줄 뿐이고 내부 상태 보호는 개발자 몫이다. 이 문장 자체는 위 문서가 직접 적은 것이 아니라 문서 내용(상태 있는 빈은 싱글톤으로 쓰지 말라)에서 이끌어 낸 정리다. 또 `AtomicLong`, `ConcurrentHashMap`은 자바 표준 라이브러리의 동시성 도구라는 일반 지식이다.

(실험 확인) 스프링 없이 순수 자바로 같은 상황을 재현했다. 가변 필드 하나를 공유하는 객체에 두 스레드가 각자 값("A", "B")을 쓴 뒤 배리어로 겹치게 하고 읽으면, 두 요청 모두 마지막에 쓴 "B"를 읽었다. 같은 일을 지역 변수로만 하면 각자 "A", "B"를 읽었다. 8개 스레드가 `int++`를 각각 5만 번 실행하면 기대값 400000에 못 미쳤고(이번 실행은 72761, 값은 실행마다 다르다), `AtomicLong`은 400000으로 유실이 없었다.

```java
class StatefulService {
    private String currentUser;          // 모든 스레드가 공유
    String handle(String user, CyclicBarrier barrier) throws Exception {
        this.currentUser = user;         // (1) 내 데이터를 필드에 저장
        barrier.await();                 // 다른 요청도 (1)을 끝낼 때까지 대기
        return this.currentUser;         // (2) 내 값을 읽는다고 믿지만 마지막에 쓴 값이 나온다
    }
}
```
