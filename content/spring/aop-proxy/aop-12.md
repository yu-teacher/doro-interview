---
slug: "aop-12"
topic: "aop-proxy"
tier: DEEP
difficulty: 2
title: "CGLIB 프록시를 만들 때 생성자는 어떻게 되나요?"
keywords: ["Objenesis", "생성자 이중 호출 가능성", "생성자에 부수효과 금지"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/aop/proxying.html"]
concepts: [proxy]
importance: 1
links: [{to: "ioc-12", kind: RELATED}]
---
**모범 답변 (30~60초)**
CGLIB 프록시 인스턴스는 Objenesis로 생성되기 때문에 프록시를 만들 때 대상의 생성자를 다시 호출하지 않습니다. 그래서 보통 프록시 생성 때문에 생성자 부수효과가 중복되지는 않습니다. 다만 JVM이 생성자 우회를 허용하지 않는 환경이면 생성자가 두 번 호출되고 Spring AOP의 디버그 로그 항목도 두 번 나올 수 있다고 문서가 경고합니다. 이 경우 생성자 호출 횟수에 의존하는 로직이 있으면 중복 실행될 수 있습니다. 이 밖에 CGLIB은 Java 모듈 시스템 제약이 있어, 모듈 경로에서는 `java.lang` 패키지 클래스에 CGLIB 프록시를 만들 수 없습니다.

(공식 문서, Proxying Mechanisms) 프록시 대상의 생성자는 CGLIB 프록시 인스턴스가 Objenesis로 만들어지므로 두 번 호출되지 않는다. 다만 JVM이 생성자 우회를 허용하지 않으면 중복 호출과 그에 대응하는 디버그 로그 항목이 보일 수 있다. 또 CGLIB 프록시는 Java 모듈 시스템 제약이 있어 모듈 경로에서 `java.lang` 패키지 클래스에는 CGLIB 프록시를 만들 수 없고, 이때는 `--add-opens=java.base/java.lang=ALL-UNNAMED` 플래그가 필요하다.
(실험 확인) 생성자에서 호출 횟수를 세는 대상 객체를 만든 뒤(1회) `ProxyFactory`로 CGLIB 프록시를 만들어도 호출 횟수는 1로 유지된다.
