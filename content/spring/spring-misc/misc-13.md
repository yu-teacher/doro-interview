---
slug: "misc-13"
topic: "spring-misc"
tier: TRICKY
difficulty: 3
title: "싱글톤 빈 안에서 요청별 데이터를 어디에 담나요? ThreadLocal은 괜찮나요?"
keywords: ["지역 변수 우선", "request 스코프", "ThreadLocal 정리(remove)", "스레드 풀 재사용", "비동기 전파 문제"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/beans/factory-scopes.html", "https://docs.spring.io/spring-security/reference/servlet/architecture.html", "https://docs.spring.io/spring-security/reference/servlet/authentication/architecture.html", "https://docs.spring.io/spring-security/reference/servlet/integrations/concurrency.html"]
---
**모범 답변 (30~60초)**
기본은 메서드 파라미터와 지역 변수로 넘기는 것이고, 그게 가장 안전합니다. 요청 단위 컨텍스트가 꼭 필요하면 request 스코프 빈을 쓰는데, 싱글톤에 주입할 때는 스코프 프록시를 넣어 요청마다 실제 인스턴스를 찾게 해야 합니다. `ThreadLocal`도 쓸 수 있는데, Spring Security의 `SecurityContextHolder`가 기본으로 `ThreadLocal`에 현재 인증 정보를 저장합니다. 다만 스레드 풀은 스레드를 재사용하므로 요청이 끝나면 반드시 비워야 값이 새지 않고, 새 스레드나 비동기 작업으로 넘어가면 값이 자동으로 전파되지 않으니 `DelegatingSecurityContextRunnable` 같은 방법으로 직접 옮겨야 합니다.

(공식 문서) 빈 스코프 문서는 request 스코프가 HTTP 요청마다 새 인스턴스를 만들며 상태 변경이 다른 요청에 보이지 않는다고 하고, `DispatcherServlet`, `RequestContextListener`, `RequestContextFilter`가 모두 HTTP 요청 객체를 그 요청을 처리하는 스레드에 바인딩해 요청·세션 스코프 빈을 호출 체인 아래에서 쓸 수 있게 한다고 설명한다. 수명이 긴 빈에 요청 스코프 빈을 주입하려면 같은 인터페이스를 노출하고 해당 스코프에서 실제 대상을 찾는 AOP 프록시를 주입하면 된다고 한다. Spring Security 인증 문서는 `SecurityContextHolder`가 기본적으로 `ThreadLocal`을 써서 같은 스레드의 메서드에서는 인자로 넘기지 않아도 `SecurityContext`를 쓸 수 있고, 현재 주체의 요청 처리가 끝난 뒤 스레드를 비워 주면 이 방식은 꽤 안전하다고 한다. 스레드 모델에 안 맞는 경우를 위해 `MODE_INHERITABLETHREADLOCAL` 같은 모드도 있다. 아키텍처 문서는 `FilterChainProxy`가 메모리 누수를 피하려고 `SecurityContext`를 비운다고 하며, 동시성 문서는 보안 정보가 보통 스레드 단위로 저장되므로 새 스레드에서 작업하면 `SecurityContext`를 잃고, `DelegatingSecurityContextRunnable` 같은 추상화로 한 스레드의 컨텍스트를 다른 스레드로 옮길 수 있다고 설명한다.

(보충) 위 `SecurityContextHolder`의 `ThreadLocal` 설명을 "일반 `ThreadLocal`은 스레드 풀에서 반드시 정리해야 한다"로 일반화한 부분은 Security 문서의 맥락을 넓혀 쓴 정리다. 요청 스코프 빈과 `ThreadLocal` 중 무엇을 쓸지는 설계 선택이며 문서가 우열을 정하지는 않는다.
