---
slug: "boot-16"
topic: "spring-boot"
tier: TRICKY
difficulty: 3
title: "메인 클래스를 최상위 패키지에 두지 않으면 어떤 문제가 생기나요?"
keywords: ["스캔 범위", "auto-configuration packages", "@AutoConfigurationPackage"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
"`@ComponentScan`이 메인 클래스가 있는 패키지를 기준으로 스캔하기 때문에, 그 바깥 패키지에 있는 컴포넌트는 발견되지 않아 빈이 등록되지 않습니다. 또 JPA 엔티티와 Spring Data 리포지토리를 찾는 기본 범위인 자동 설정 패키지도 `@EnableAutoConfiguration`이 붙은 클래스의 패키지에서 정해지므로, 같은 문제가 생깁니다. 데모는 `com.kdt.board`를 루트로 쓰는 구조로 보이므로(로그 설정 기준) 하위 패키지에 모아 두는 게 맞습니다."

- 공식 문서: 자동 설정 패키지는 엔티티와 Spring Data 리포지토리를 기본으로 찾는 패키지이며 `@AutoConfigurationPackage`로 추가할 수 있다.
- (보충) 데모 메인 클래스의 실제 패키지는 읽어서 확인하지 않았고 `logging.level`의 `com.kdt.board`로부터의 추정이다.
