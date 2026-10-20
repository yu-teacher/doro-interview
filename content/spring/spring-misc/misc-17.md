---
slug: "misc-17"
topic: "spring-misc"
tier: TRICKY
difficulty: 3
title: "Spring 7 / Boot 4로 올릴 때 면접관에게 어떤 점을 짚어 말하면 좋을까요?"
keywords: ["JDK 17 기준·25 권장", "Jakarta EE 11", "Jackson 3", "JSpecify", "Hibernate 7", "마이그레이션 체크리스트"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
Framework 7은 JDK 17을 기반으로 유지하지만 JDK 25를 권장하고 Jakarta EE 11 기준(Servlet 6.1, JPA 3.2 등)으로 올라갑니다. Jackson은 3.x가 기본이 되고 2.x는 deprecated 되었으며, 코드베이스의 널 안정성 표기가 JSpecify로 바뀌고 JSR 305는 deprecated입니다. Hibernate ORM은 7.x를 지원합니다. 그래서 업그레이드 시 확인할 것은 JDK, 서블릿 컨테이너, Jackson import 경로, null 어노테이션, Hibernate 버전입니다. 새 기능으로는 API 버저닝, `@Retryable`/`@ConcurrencyLimit`, `RestTestClient`가 눈에 띕니다.

(공식) Framework 7.0 릴리스 노트와 Boot 4.0 릴리스 노트(Jackson 3.0, Servlet 6.1, JPA 3.2 등 개별 스펙 업그레이드 항목)에서 확인했다.
