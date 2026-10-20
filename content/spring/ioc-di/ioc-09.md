---
slug: "ioc-09"
topic: "ioc-di"
tier: BASIC
difficulty: 1
title: "BeanFactory와 ApplicationContext의 차이는 무엇인가요?"
keywords: ["BeanFactory = 기본", "ApplicationContext = 상위 집합", "후처리기 자동 등록", "이벤트/MessageSource/i18n", "대부분 ApplicationContext 사용"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/beans/beanfactory.html", "https://docs.spring.io/spring-framework/reference/core/beans/introduction.html", "https://docs.spring.io/spring-framework/reference/core/beans/context-introduction.html"]
---
**모범 답변 (30~60초)**
BeanFactory는 빈을 인스턴스화하고 연결하는 기본 기능을 제공하는 컨테이너 인터페이스입니다. ApplicationContext는 이것의 하위 인터페이스이자 상위 집합으로, 생명주기 관리, BeanPostProcessor와 BeanFactoryPostProcessor 자동 등록, 메시지 소스(국제화), 이벤트 발행, AOP 통합, 웹 전용 컨텍스트 등을 추가로 제공합니다. 순수 DefaultListableBeanFactory는 후처리기를 자동으로 감지하지 않아서 AutowiredAnnotationBeanPostProcessor 같은 것을 직접 등록해야 @Autowired가 동작합니다. 그래서 완전한 빈 처리 제어가 필요한 경우가 아니면 ApplicationContext를 사용하는 것이 맞습니다.

- (공식 문서) 기능 비교표(BeanFactory는 생명주기 관리, BPP/BFPP 자동 등록, MessageSource, 이벤트 발행이 없고 ApplicationContext는 있음)와 소개 페이지의 설명(ApplicationContext는 AOP 통합, 메시지 리소스 처리, 이벤트 발행, 웹용 컨텍스트를 더한 BeanFactory의 완전한 상위 집합)이다. ApplicationContext가 BeanFactory의 모든 기능을 포함하므로, 빈 처리에 대한 완전한 제어가 필요한 경우가 아니면 일반 BeanFactory보다 ApplicationContext를 권장한다고 한다. 순수 `DefaultListableBeanFactory`에는 `addBeanPostProcessor`로 후처리기를 명시 등록해야 한다.
- (실험 확인) 순수 `DefaultListableBeanFactory`에서는 `@Autowired` 필드가 채워지지 않고 `@PostConstruct`도 호출되지 않는다. `AnnotationConfigApplicationContext`에서는 둘 다 처리되고 `ContextRefreshedEvent` 같은 이벤트도 발행된다.
