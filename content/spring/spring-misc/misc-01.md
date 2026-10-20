---
slug: "misc-01"
topic: "spring-misc"
tier: BASIC
difficulty: 1
title: "싱글톤 빈은 왜 stateless 하고 thread-safe 해야 하나요?"
keywords: ["싱글톤 스코프", "공유 인스턴스", "가변 필드 금지", "생성자 주입 + final", "지역 변수", "요청별 상태"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
스프링 빈의 기본 스코프는 싱글톤이라서 컨테이너 안에 인스턴스가 딱 하나만 만들어지고, 모든 요청 스레드가 그 하나를 같이 씁니다. 톰캣은 요청마다 워커 스레드를 배정하니까 동시에 여러 스레드가 같은 서비스 객체의 메서드를 호출하죠. 이때 서비스에 `private int count` 같은 가변 필드가 있으면 요청 간에 값이 섞이고, 한 사용자의 데이터가 다른 사용자에게 보이는 사고까지 날 수 있습니다. 그래서 필드에는 불변인 의존성(repository 등)만 두고, 요청별 상태는 지역 변수나 파라미터, 반환값으로만 다루는 것이 원칙입니다. 꼭 상태가 필요하면 `ConcurrentHashMap`, `AtomicLong` 같은 동시성 도구를 쓰거나 스코프를 request/prototype으로 바꿉니다.

```java
@Service
public class BadCounterService {
    private int count;                 // 모든 요청 스레드가 공유 -> race condition
    public int next() { return ++count; }   // ++ 는 원자적이지 않다
}
```

(보충) 싱글톤이 "thread-safe를 보장"해 주는 것은 아니다. 컨테이너는 인스턴스를 하나 만들어 줄 뿐, 내부 상태 보호는 개발자 몫이다.
