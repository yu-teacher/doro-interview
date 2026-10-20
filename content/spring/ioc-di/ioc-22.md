---
slug: "ioc-22"
topic: "ioc-di"
tier: TRICKY
difficulty: 3
title: "스프링 컨테이너의 종료 시 정리는 어떻게 보장하나요?"
keywords: ["registerShutdownHook", "SmartLifecycle phase", "stop(Runnable)", "단계당 30초", "소멸 로직은 stop에 의존 금지"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
웹 애플리케이션은 웹용 ApplicationContext가 앱 종료 시 컨테이너를 정상 종료해 소멸 콜백이 호출됩니다. 비웹 애플리케이션은 JVM 종료 훅을 등록해야 하며 `registerShutdownHook()`을 호출합니다. 또 Lifecycle/SmartLifecycle 빈은 stop 신호를 받고, 일반 종료에서는 stop이 소멸 메서드보다 먼저 호출되지만 그 보장은 절대적이지 않으므로 소멸 로직은 stop 없이도 동작하게 짜야 합니다. 기본 종료 대기 시간은 단계(phase)당 30초입니다.

- (공식 문서) 위 내용 전부(`DefaultLifecycleProcessor`의 `timeoutPerShutdownPhase`로 변경 가능).
