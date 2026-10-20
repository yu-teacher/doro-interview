---
slug: "ioc-09"
topic: "ioc-di"
tier: BASIC
difficulty: 1
title: "BeanFactory와 ApplicationContext의 차이는 무엇인가요?"
keywords: ["BeanFactory = 기본", "ApplicationContext = 상위 집합", "후처리기 자동 등록", "이벤트/MessageSource/i18n", "대부분 ApplicationContext 사용"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
BeanFactory는 빈을 인스턴스화하고 연결하는 기본 기능을 제공하는 최상위 컨테이너 인터페이스입니다. ApplicationContext는 이것의 하위 인터페이스이자 상위 집합으로, 생명주기 관리, BeanPostProcessor와 BeanFactoryPostProcessor 자동 등록, 메시지 소스(국제화), 이벤트 발행, AOP 통합, 웹 전용 컨텍스트 등을 추가로 제공합니다. 순수 DefaultListableBeanFactory를 쓰면 AutowiredAnnotationBeanPostProcessor 같은 것을 직접 등록해야 @Autowired가 동작합니다. 그래서 특별한 이유가 없으면 ApplicationContext를 사용하는 것이 맞습니다.

- (공식 문서) 위 비교표와 "BeanFactory는 프레임워크 통합이나 자원 제약 환경처럼 명시적 제어가 필요한 경우에만" 이라는 가이드는 BeanFactory API 페이지와 소개 페이지 내용이다.
