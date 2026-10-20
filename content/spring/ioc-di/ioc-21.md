---
slug: "ioc-21"
topic: "ioc-di"
tier: TRICKY
difficulty: 3
title: "@PostConstruct에서 무거운 작업을 하면 안 되는 이유는 무엇인가요?"
keywords: ["싱글톤 생성 락", "초기화 데드락", "가볍게 유지", "SmartInitializingSingleton", "ContextRefreshedEvent"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/beans/factory-nature.html"]
concepts: [bean-lifecycle]
importance: 1
---
**모범 답변 (30~60초)**
초기화 메서드는 컨테이너의 싱글톤 생성 락 안에서 실행됩니다. 공식 문서는 초기화 메서드를 설정 상태 검증과 설정에 기반한 자료구조 준비 정도로 한정하고, 외부 빈에 접근하는 활동은 초기화 데드락 위험이 있다고 경고합니다. 비용이 큰 초기화 이후 작업, 예를 들어 비동기 DB 준비 같은 것은 SmartInitializingSingleton이나 ContextRefreshedEvent 리스너에서 처리하라고 합니다. 이 지점들은 모든 일반 싱글톤 초기화가 끝난 뒤이므로 싱글톤 생성 락 밖에서 실행됩니다. 컨테이너 전체 생명주기와 연동하려면 SmartLifecycle을 구현할 수도 있습니다.

- (공식 문서) 라이프사이클 콜백 페이지의 초기화 콜백 절 내용 전부(7.0.9 기준). `@PostConstruct`가 반환해야 빈이 완전히 초기화되어 다른 곳에 공개된 것으로 간주된다.
