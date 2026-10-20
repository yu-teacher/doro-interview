---
slug: "aop-08"
topic: "aop-proxy"
tier: DEEP
difficulty: 2
title: "Spring은 프록시를 언제, 어떻게 만드나요? (BeanPostProcessor / auto-proxy)"
keywords: ["auto-proxy creator", "BeanPostProcessor", "초기화 이후 프록시로 교체", "Advisor 매칭", "주입되는 것은 프록시"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
`@EnableAspectJAutoProxy`(Boot에서는 자동 설정)를 켜면 auto-proxy creator가 등록됩니다. 이것은 BeanPostProcessor 계열이라 빈이 생성되고 초기화되는 과정에 끼어들어, 해당 빈에 적용될 Advisor(Pointcut 매칭)가 있는지 찾고 있으면 원본 대신 프록시를 반환해서 컨테이너에 등록합니다. 그래서 다른 빈이 주입받는 것은 원본이 아니라 프록시입니다. 적용 대상이 없는 빈은 프록시 없이 그대로 쓰입니다. 문서도 어떤 빈이 하나 이상의 Aspect에 의해 어드바이스된다고 판단되면 자동으로 프록시를 만들어 메서드 호출을 가로챈다고 설명합니다.

- 공식 문서(aspectj-support): 어드바이스 대상으로 판단된 빈에 자동으로 프록시를 생성한다. `aspectjweaver`(1.9 이상)가 클래스패스에 필요하다고 명시되어 있다. Proxying Mechanisms 페이지는 "통합 auto-proxy creator"를 언급한다.
- (보충) `AnnotationAwareAspectJAutoProxyCreator`가 BeanPostProcessor이며 초기화 후(`postProcessAfterInitialization`) 단계에서 래핑한다는 구체 설명은 이번에 읽은 페이지에 없었고, 일반 지식에 의한 서술이다. 프로그래밍 방식으로는 `ProxyFactory`로 컨테이너 없이도 프록시를 만들 수 있다(공식 문서).
