---
slug: "aop-07"
topic: "aop-proxy"
tier: BASIC
difficulty: 1
title: "Spring AOP와 AspectJ의 차이는?"
keywords: ["프록시 vs 바이트코드 위빙", "메서드 실행만", "Spring 빈만", "필드 접근 불가", "가장 단순한 것 선택"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
Spring AOP는 프록시 기반이라 Spring 빈의 메서드 실행 지점만 어드바이스할 수 있고, 별도 컴파일러나 위버가 필요 없어 간단합니다. AspectJ는 바이트코드에 직접 위빙(컴파일 타임/로드 타임)하는 완전한 AOP 프레임워크라서 필드 접근, 생성자 같은 다른 조인포인트와 Spring이 관리하지 않는 객체도 다룰 수 있고, 자기 호출도 적용됩니다. 공식 문서도 "동작하는 가장 단순한 것"을 쓰라고 하고, 빈의 메서드 실행만 필요하면 Spring AOP, 도메인 객체나 필드 접근이 필요하면 AspectJ를 권합니다. 둘은 경쟁이 아니라 보완 관계입니다.

- 공식 문서(Choosing which AOP / Capabilities and Goals / Using AspectJ): 위 내용 + AspectJ LTW, `@Configurable`. 같은 문서가 `<aop:aspectj-autoproxy/>`는 @AspectJ 문법을 쓸 뿐 여전히 Spring AOP 프록시라고 명시한다.
- 참고: `@Aspect` 어노테이션과 AspectJ 포인트컷 표현식을 쓴다고 AspectJ 위빙을 하는 것이 아니다. 이 점을 면접에서 자주 헷갈려 한다.
