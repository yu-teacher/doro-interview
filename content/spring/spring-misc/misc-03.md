---
slug: "misc-03"
topic: "spring-misc"
tier: BASIC
difficulty: 1
title: "POJO와 비침투적(non-invasive) 철학이란 무엇인가요?"
keywords: ["POJO", "비침투성", "테스트 용이성", "프록시 기반 AOP", "어노테이션 의존"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
스프링은 비즈니스 객체가 특정 프레임워크 클래스를 상속하거나 인터페이스를 구현하도록 강제하지 않는 것을 지향합니다. 그냥 평범한 자바 객체, 즉 POJO에 어노테이션이나 설정으로 "이 객체를 이렇게 다뤄 달라"고 알려 주는 방식이죠. 그 덕분에 서비스 클래스를 컨테이너 없이 `new`로 만들어 단위 테스트할 수 있고, 프레임워크를 바꾸더라도 도메인 코드의 변경이 작습니다. EJB 2 시절에 컴포넌트가 컨테이너 API에 묶여 테스트가 어려웠던 문제에 대한 반작용으로 이해하면 됩니다. 다만 어노테이션도 결국 의존이라는 점, 그리고 `@Transactional` 같은 프록시 기능은 순수 POJO와 다르게 동작한다는 점은 현실적으로 알고 있어야 합니다.

(보충) 이 설명의 EJB 배경은 필자의 일반 지식이며 이번에 조사한 문서에서 직접 확인한 것은 아니다.

```java
// 컨테이너 없이도 테스트 가능한 서비스 (생성자 주입 덕분)
MemberService service = new MemberService(fakeMemberRepository);
```
