---
slug: "aop-02"
topic: "aop-proxy"
tier: BASIC
difficulty: 1
title: "AOP 용어(Aspect, Join Point, Advice, Pointcut, Advisor, Weaving)를 설명해 주세요."
keywords: ["Aspect", "Join Point(=메서드 실행)", "Advice", "Pointcut", "Weaving(런타임)", "Target", "AOP Proxy"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
Aspect는 횡단 관심사를 묶은 모듈이고, Spring에서는 `@Aspect`가 붙은 클래스입니다. Join Point는 프로그램 실행 중의 한 지점인데, Spring AOP에서는 항상 메서드 실행을 뜻합니다. Advice는 그 지점에서 실제로 수행할 동작이고, Pointcut은 어떤 Join Point에 Advice를 적용할지 고르는 조건식으로 기본적으로 AspectJ 표현식을 씁니다. Weaving은 Aspect를 대상 객체와 엮어 어드바이스된 객체를 만드는 일인데, 컴파일 시점, 로드 시점, 런타임 모두 가능하고 Spring AOP는 런타임에 합니다. Advisor는 "Advice + Pointcut" 한 쌍을 묶은 Spring 고유 개념입니다.

- 공식 문서(AOP Concepts)에 Aspect/Join point/Advice/Pointcut/Introduction/Target/AOP proxy/Weaving 정의가 있다. Advisor 정의는 이번에 읽은 페이지에는 없었다.
- (보충) Advisor = Advice와 Pointcut을 하나로 묶은 Spring 내부 단위. `@Aspect`의 각 어드바이스 메서드가 내부적으로 Advisor로 변환되어 프록시 체인에 들어간다. 이 부분은 문서에서 직접 확인하지 못했다.
