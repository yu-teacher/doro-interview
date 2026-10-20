---
slug: "ioc-22"
topic: "ioc-di"
tier: TRICKY
difficulty: 3
title: "스프링 컨테이너의 종료 시 정리는 어떻게 보장하나요?"
keywords: ["registerShutdownHook", "SmartLifecycle phase", "stop(Runnable)", "단계당 10초(6.2+)", "소멸 로직은 stop에 의존 금지"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/beans/factory-nature.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/support/DefaultLifecycleProcessor.html"]
---
**모범 답변 (30~60초)**
웹 애플리케이션은 웹용 ApplicationContext가 앱 종료 시 컨테이너를 정상 종료해 소멸 콜백이 호출됩니다. 비웹 애플리케이션은 JVM 종료 훅을 등록해야 하며 registerShutdownHook()을 호출합니다. 또 Lifecycle/SmartLifecycle 빈은 stop 신호를 받고, 일반 종료에서는 stop이 소멸 메서드보다 먼저 호출되지만 그 보장은 절대적이지 않으므로 소멸 로직은 stop 없이도 동작하게 짜야 합니다. SmartLifecycle은 stop(Runnable)에 받은 콜백을 정리 완료 시 호출해 비동기 종료를 알립니다. SmartLifecycle의 stop 대기 시간은 단계(phase)당 기본 10초이고 DefaultLifecycleProcessor로 조정할 수 있습니다.

- (공식 문서) 비웹 앱의 `registerShutdownHook()` 필요성, 웹 기반 컨텍스트는 이미 정상 종료 코드가 있다는 점, `Lifecycle`의 이른 stop 신호와 `SmartLifecycle`의 시간 제한 stop 단계(`stop(Runnable)`을 완료 시 호출), 일반 종료에서만 stop이 destroy 앞서고 핫 리프레시나 중단된 refresh에서는 destroy만 호출된다는 점, 부트스트랩 취소나 다른 빈 때문에 stop이 타임아웃된 경우를 위해 destroy는 stop 없이도 동작해야 한다는 강한 권고는 라이프사이클 페이지 내용이다.
- (공식 문서, Javadoc) `DefaultLifecycleProcessor`의 `setTimeoutPerShutdownPhase` 기본값은 6.2부터 10000ms(10초)다. 단계당 대기 시간은 이 프로퍼티(또는 단계별 `setTimeoutForShutdownPhase`)로 바꿀 수 있다. 일부 자료에는 이전 기본값인 30초로 적혀 있으니 버전에 주의한다. 7.0.9 소스에서도 `timeoutPerShutdownPhase = 10000`으로 선언되어 있다.
