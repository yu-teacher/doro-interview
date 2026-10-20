---
slug: "ioc-20"
topic: "ioc-di"
tier: TRICKY
difficulty: 3
title: "싱글톤 빈의 지연 초기화(lazy)와 시작 시점 오류 검출은 어떤 관계인가요?"
keywords: ["eager 기본", "fail-fast", "시작 비용 vs 조기 발견", "lazy는 첫 사용 시 실패"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-lazy-init.html", "https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-collaborators.html"]
concepts: [bean-lifecycle]
importance: 1
---
**모범 답변 (30~60초)**
싱글톤은 ApplicationContext가 기본적으로 시작 시 미리 인스턴스화합니다. 덕분에 설정 오류나 순환 의존, 누락된 빈이 컨텍스트가 만들어질 때 바로 드러납니다. 공식 문서도 문제를 몇 시간이나 며칠 뒤가 아니라 시작 시점에 발견하는 편이 낫다고 설명합니다. 대신 시작 시간과 메모리를 먼저 쓰는 비용이 있습니다. 지연 초기화를 켜면 첫 요청 시점에 인스턴스를 만들어 이를 줄일 수 있지만, 그 빈의 생성 문제는 처음 요청될 때에야 드러납니다. 또 지연 빈이 지연이 아닌 싱글톤의 의존성이면 시작 시점에 함께 만들어집니다.

- (공식 문서) 의존성 주입 페이지의 의존성 해석 설명(컨테이너는 생성 시 설정을 검증하되 빈 프로퍼티는 실제 생성 때 설정되며, 해석 불일치가 첫 생성 때 늦게 나타날 수 있어 기본으로 싱글톤을 미리 인스턴스화한다는 내용)과 지연 초기화 페이지(지연 빈은 처음 요청될 때 생성, 지연이 아닌 싱글톤이 의존하면 시작 시 생성)를 정리한 것이다. 시작 시간과 메모리를 먼저 쓰는 대가로 컨텍스트 생성 시점에 구성 문제를 발견한다고 한다.
