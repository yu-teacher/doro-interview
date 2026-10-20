---
slug: "aop-18"
topic: "aop-proxy"
tier: TRICKY
difficulty: 3
title: "private 메서드나 같은 클래스 내부 호출에도 Aspect를 적용하고 싶으면?"
keywords: ["빈 분리", "AspectJ CTW/LTW", "빌드/에이전트 비용"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
Spring AOP로는 구조적으로 안 되므로 먼저 설계를 바꿉니다. 호출 대상을 별도 빈으로 분리하거나 메서드를 public으로 노출하는 쪽이 가장 현실적입니다. 그래도 필요하면 AspectJ를 컴파일 타임이나 로드 타임 위빙으로 쓰면 되고, 이 경우 바이트코드가 직접 수정되니 자기 호출과 비 public 메서드도 어드바이스됩니다. 대신 빌드 설정이나 JVM 에이전트 설정이 필요합니다.

- 공식 문서(Using AspectJ): 자기 호출 회피와 비 public 트랜잭션 대응에 AspectJ 위빙이 필요함, LTW는 `META-INF/aop.xml`, `@EnableLoadTimeWeaving`, `spring-instrument.jar` 에이전트를 사용한다고 서술한다.
