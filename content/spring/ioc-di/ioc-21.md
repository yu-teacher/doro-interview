---
slug: "ioc-21"
topic: "ioc-di"
tier: TRICKY
difficulty: 3
title: "@PostConstruct에서 무거운 작업을 하면 안 되는 이유는 무엇인가요?"
keywords: ["싱글톤 생성 락", "초기화 데드락", "가볍게 유지", "SmartInitializingSingleton", "ContextRefreshedEvent"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
초기화 메서드는 컨테이너의 싱글톤 생성 락 안에서 실행됩니다. 여기서 시간이 오래 걸리는 작업을 하거나 다른 빈에 접근하면 초기화 데드락 위험이 있습니다. 그래서 초기화 메서드는 설정 검증이나 간단한 자료구조 준비 정도로 가볍게 두고, 무거운 후처리는 SmartInitializingSingleton이나 ContextRefreshedEvent 리스너처럼 모든 싱글톤이 만들어진 뒤 락 밖에서 실행되는 지점에서 처리하는 것이 좋습니다.

- (공식 문서) 위 내용 전부(최신 문서 기준).
