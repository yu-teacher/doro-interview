---
slug: "ioc-06"
topic: "ioc-di"
tier: BASIC
difficulty: 1
title: "빈 스코프에는 어떤 것들이 있고, 기본은 무엇인가요?"
keywords: ["singleton(기본)", "prototype", "request/session/application/websocket", "웹 인식 컨텍스트", "컨테이너 단위 싱글톤"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/beans/factory-scopes.html"]
concepts: [bean-lifecycle]
importance: 3
links: [{to: "ioc-07", kind: FOLLOWUP}, {to: "ioc-13", kind: FOLLOWUP}, {to: "ioc-14", kind: FOLLOWUP}, {to: "pat-02", kind: RELATED}]
---
**모범 답변 (30~60초)**
기본은 singleton으로, 컨테이너당 빈 정의 하나에 인스턴스 하나를 만들어 캐시하고 모든 주입과 조회에 같은 객체를 돌려줍니다. prototype은 요청할 때마다 새 인스턴스를 만듭니다. 웹 환경에서는 request(HTTP 요청마다 새 인스턴스), session, application, websocket 스코프가 추가로 있고, 이들은 웹 인식 ApplicationContext가 필요합니다. 스프링 MVC에서는 DispatcherServlet이 요청 정보를 노출해 주므로 추가 설정이 필요 없습니다.

- (공식 문서) 위 내용 전부(여섯 스코프 중 네 개가 웹 전용). 스레드 스코프는 제공되지만 기본 등록되지 않는다. 또한 스프링 싱글톤은 GoF 싱글톤 패턴과 다르다. GoF는 클래스로더당 클래스 하나, 스프링은 컨테이너·빈 정의당 하나다. 같은 클래스에 빈 정의를 두 개 두면 인스턴스가 둘이다.
- (실험 확인) 같은 클래스를 서로 다른 이름의 빈으로 두 번 정의하면 서로 다른 인스턴스가 만들어진다.

```java
@Component
@Scope("prototype")          // 기본 singleton을 prototype으로 변경
class Command { }

@RequestScope                // request 스코프 합성 애노테이션
@Component
class LoginAction { }
```
