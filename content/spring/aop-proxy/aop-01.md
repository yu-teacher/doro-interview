---
slug: "aop-01"
topic: "aop-proxy"
tier: BASIC
difficulty: 1
title: "AOP가 무엇이고 왜 쓰나요?"
keywords: ["횡단 관심사", "Aspect", "선언적 트랜잭션", "중복 제거", "비즈니스 로직 분리"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
AOP는 OOP를 보완하는 방식입니다. OOP의 모듈 단위가 클래스라면 AOP의 단위는 Aspect이고, 트랜잭션 관리처럼 여러 타입과 객체에 걸쳐 있는 횡단 관심사를 모듈화합니다. 이걸 쓰면 비즈니스 코드에 트랜잭션 시작/커밋이나 로깅 코드를 섞지 않아도 되어서 코드가 깔끔해지고 중복이 줄어듭니다. Spring은 AOP로 선언적 트랜잭션 같은 엔터프라이즈 서비스를 제공하고, 개발자가 직접 Aspect를 만들 수도 있습니다. 참고로 IoC 컨테이너는 AOP에 의존하지 않아서 AOP 없이도 Spring을 쓸 수 있습니다.
