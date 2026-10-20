---
slug: "ioc-14"
topic: "ioc-di"
tier: DEEP
difficulty: 2
title: "싱글톤 빈에 prototype 또는 request 스코프 빈을 주입하면 어떤 문제가 생기나요?"
keywords: ["주입은 생성 시 1회", "ObjectProvider", "메서드(lookup) 주입", "스코프 프록시(CGLIB 기본)", "proxyMode"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
의존성은 싱글톤이 생성될 때 한 번만 해석됩니다. 그래서 싱글톤에 prototype을 주입하면 그 시점에 만들어진 인스턴스 하나를 평생 들고 있어 prototype의 의미가 사라지고, request나 session 스코프 빈을 주입하면 특정 요청과 무관한 단일 객체가 박히게 됩니다. 해결책은 두 가지입니다. 매번 새 인스턴스가 필요하면 ObjectProvider를 주입해 필요할 때 getObject로 가져오거나 메서드 주입을 씁니다. 웹 스코프 빈은 스코프 프록시(proxyMode)를 쓰면 프록시가 호출 시점에 현재 요청/세션의 실제 대상을 찾아 위임합니다.

- (공식 문서) 문제 설명, `ObjectProvider`/`ObjectFactory`, 메서드 주입, 스코프 프록시 동작(기본 CGLIB, private 메서드는 가로채지 못함, JDK 프록시는 인터페이스 필요). prototype 대상 프록시는 메서드 호출마다 새 대상 인스턴스를 만든다는 설명도 있다.

```java
@Component
class CommandProcessor {
    private final ObjectProvider<Command> provider;
    CommandProcessor(ObjectProvider<Command> provider) { this.provider = provider; }
    void process() { provider.getObject().execute(); }   // 호출마다 새 prototype
}

@Component
@RequestScope                      // @RequestScope는 기본적으로 프록시 모드가 적용됨(보충)
class RequestContext { }
```

- (보충) `@RequestScope`의 기본 proxyMode가 TARGET_CLASS라는 점은 이번 문서에서 직접 확인하지 못했다. 면접에서는 "스코프 프록시를 쓴다" 정도로 답하는 것이 안전하다.
