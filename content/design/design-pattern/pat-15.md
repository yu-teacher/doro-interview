---
slug: "pat-15"
topic: "design-pattern"
tier: BASIC
difficulty: 1
title: "옵저버 패턴은 무엇이고, 스프링의 이벤트 기능은 어떻게 이 패턴을 구현하나요?"
keywords: ["주체가 옵저버 목록 보유", "수신자를 모르는 알림", "ApplicationEvent 발행", "ApplicationListener", "publishEvent"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://objectmentor.com/resources/articles/Principles_and_Patterns.pdf", "https://docs.spring.io/spring-framework/reference/core/beans/context-introduction.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/ApplicationListener.html"]
---
**모범 답변 (30~60초)**
옵저버는 어떤 객체에서 일어난 일을, 그 객체가 구체적인 수신자를 모른 채 관심 있는 쪽들에게 알리는 패턴입니다. Robert Martin은 센서가 미터를 몰라도 되도록, 주체가 등록된 옵저버 목록을 돌며 갱신 메서드를 호출하는 구조로 설명합니다. 스프링 문서는 `ApplicationEvent`와 `ApplicationListener`를 두고, 이벤트가 컨텍스트에 발행될 때마다 등록된 리스너 빈이 통지받는 방식이 본질적으로 표준 Observer 패턴이라고 직접 말합니다. 발행은 `ApplicationEventPublisher`의 `publishEvent`로 합니다.

(원저자 자료) Martin, Design Principles and Design Patterns(2000), 쪽 번호(머리글 기준) 29~30의 "Observer" 절: 한 요소가 다른 요소의 이벤트 발생에 반응해야 하지만 감지하는 쪽이 반응하는 쪽을 알 필요가 없을 때 쓰며, `Subject`가 옵저버 목록을 갖고 `Register`로 등록받아 `Notify`에서 각 옵저버의 `Update`를 호출한다고 설명한다.
(공식 문서) 스프링 Standard and Custom Events 절은 `ApplicationEvent` 클래스와 `ApplicationListener` 인터페이스로 이벤트를 처리하고, `ApplicationListener`를 구현한 빈이 컨텍스트에 있으면 이벤트가 발행될 때마다 통지되며 본질적으로 표준 Observer 패턴이라고 한다. 커스텀 이벤트는 `ApplicationEventPublisher`의 `publishEvent()`로 발행한다. `ApplicationListener` API 문서는 이 인터페이스가 Observer 패턴을 위한 표준 `EventListener` 인터페이스에 기반한다고 한다.
