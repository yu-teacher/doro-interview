---
slug: "misc-03"
topic: "spring-misc"
tier: BASIC
difficulty: 1
title: "POJO와 비침투적(non-invasive) 철학이란 무엇인가요?"
keywords: ["POJO", "비침투성", "테스트 용이성", "프록시 기반 AOP", "어노테이션 의존"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/testing/unit.html", "https://docs.spring.io/spring-framework/reference/overview.html", "https://docs.spring.io/spring-framework/reference/core/aop/proxying.html", "https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html", "https://docs.spring.io/spring-boot/reference/using/auto-configuration.html"]
concepts: [ioc-di]
importance: 2
links: [{to: "ioc-01", kind: RELATED}]
---
**모범 답변 (30~60초)**
스프링은 비즈니스 객체가 특정 프레임워크 클래스를 상속하거나 인터페이스를 구현하도록 강제하지 않는 것을 지향합니다. 평범한 자바 객체, 즉 POJO에 어노테이션이나 설정으로 컨테이너가 다룰 방법을 알려 주는 방식이죠. 공식 문서도 DI를 쓰면 코드가 컨테이너에 덜 의존하게 되어 서비스 클래스를 스프링 없이 `new`로 만들어 단위 테스트할 수 있다고 설명합니다. 스프링 자체가 초기 J2EE 명세의 복잡함에 대한 대응으로 나왔다는 점도 배경입니다. 다만 어노테이션도 결국 의존이고, `@Transactional` 같은 프록시 기반 AOP 기능은 프록시를 거칠 때만 동작해서 순수 POJO와 다르게 동작한다는 점은 알고 있어야 합니다.

```java
// 컨테이너 없이도 테스트 가능한 서비스 (생성자 주입 덕분)
MemberService service = new MemberService(fakeMemberRepository);
```

(공식 문서) 단위 테스트 문서는 의존성 주입이 전통적인 J2EE/Java EE 개발보다 코드의 컨테이너 의존을 줄여 주고, 애플리케이션을 이루는 POJO는 JUnit 테스트에서 `new` 연산자로 객체를 만들어 스프링이나 다른 컨테이너 없이 테스트할 수 있어야 한다고 설명한다. 서비스 계층 객체는 DAO·repository 인터페이스를 stub/mock으로 바꿔 영속 데이터 없이 테스트할 수 있다고도 한다. 개요 문서는 스프링이 2003년에 초기 J2EE 명세의 복잡함에 대한 대응으로 시작되었다고 적는다. AOP 문서는 Spring AOP가 프록시 기반이라는 점을 이해하는 것이 매우 중요하다고 강조하며, 트랜잭션 문서는 프록시 모드에서는 프록시를 거쳐 들어오는 외부 호출만 가로채진다고 설명한다.

(보충) "비침투적(non-invasive)"이라는 용어와 "프레임워크 클래스의 상속·구현을 강제하지 않는다"는 정리는 일반적인 설명이다. 조사한 문서에서 non-invasive 라는 표현은 Boot 자동 설정에 대해서만 확인했다(필요하면 직접 정의한 설정으로 자동 설정의 일부를 대체할 수 있다는 의미). 어노테이션도 결국 프레임워크에 대한 의존이라는 지적도 문서에 있는 문장이 아니라 일반적인 관점이다.
