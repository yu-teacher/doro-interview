---
slug: "aop-11"
topic: "aop-proxy"
tier: DEEP
difficulty: 2
title: "프록시 방식의 한계(final, private 등, Spring 빈만)는?"
keywords: ["final 클래스/메서드", "private", "가시성", "빈만 대상", "메서드 실행만"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
CGLIB은 상속으로 프록시를 만들기 때문에 final 클래스는 프록시할 수 없고, final 메서드와 private 메서드는 오버라이드할 수 없어서 어드바이스가 적용되지 않습니다. 다른 패키지 부모 클래스의 package-private 메서드처럼 보이지 않는 메서드도 사실상 private이라 마찬가지입니다. 그리고 Spring AOP는 Spring이 관리하는 빈만 대상으로 하므로 `new`로 만든 객체나 도메인 객체에는 적용되지 않고, 어드바이스 가능한 조인포인트도 메서드 실행뿐입니다. 이런 요구는 AspectJ 위빙으로 풀어야 합니다.

- 공식 문서(Proxying Mechanisms)에서 final 클래스, final/private/비가시 메서드 제약을 확인했다. 또한 (Choosing / Capabilities 페이지) Spring 빈만, 메서드 실행 조인포인트만 지원한다는 내용도 확인했다.
- 공식 문서(Using AspectJ): `@Transactional`을 비 public 메서드에 쓰려면 AspectJ 트랜잭션 aspect가 필요하다는 서술이 있다.
