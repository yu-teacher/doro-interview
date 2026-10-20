---
slug: "tst-19"
topic: "dev-test"
tier: TRICKY
difficulty: 3
title: "static 메서드나 final 클래스도 Mockito로 모킹할 수 있나요? 모킹해야 한다면 설계는 어떻게 봐야 하나요?"
keywords: ["Mockito 5 인라인 기본", "mockStatic try-with-resources", "현재 스레드에서만 유효", "final 클래스 모킹 가능", "의존성 주입으로 설계 개선"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://javadoc.io/static/org.mockito/mockito-core/5.23.0/org.mockito/org/mockito/Mockito.html"]
---
**모범 답변 (30~60초)**
Mockito 5.0부터 인라인 모의 생성기가 기본이라서 `final` 클래스와 메서드도 모킹할 수 있고, `mockStatic`으로 static 메서드도 모킹할 수 있습니다. 다만 `mockStatic`은 현재 스레드와 정한 범위 안에서만 유효해서 try-with-resources로 범위를 닫아야 하고, 다른 스레드에서 부른 static 호출에는 적용되지 않습니다. 더 근본적으로는 시간이나 외부 호출이 static 호출이나 `new`로 코드에 박혀 있어서 모킹이 필요해진 설계일 수 있으니, `Clock` 같은 협력 객체를 생성자로 주입받게 바꾸면 모킹 없이 고정 값으로 테스트할 수 있습니다. Java 21 이상에서는 인라인 모킹이 에이전트 부착 경고를 낼 수 있습니다.

(공식 문서) Mockito Javadoc 39절은 final 클래스와 메서드 모킹을 5.0.0부터 기본으로 지원한다고 하고, 0.2절은 5.0.0부터 인라인 mock maker가 기본이라고 한다. 48절은 인라인 mock maker에서 static 메서드 모킹이 현재 스레드와 사용자가 정한 범위 안에서만 유효하며 try-with-resources로 범위를 정하길 권한다고 한다. 0.3절은 Java 21부터 JDK가 라이브러리의 에이전트 자기 부착을 제한해서 명시적 설정이 필요하고 JVM이 항상 경고를 보여 준다고 설명한다. 참고로 같은 Javadoc의 spy 절에는 final 메서드는 모킹되지 않는다는 문장이 남아 있어 39절과 맞지 않는다.
(실험 확인) Mockito 5.23.0, JDK 25.0.3에서 `final` 클래스를 `mock()`으로 모킹해 스터빙한 값 `mocked`를 얻었고, `spy`로 만든 객체의 `final` 메서드도 `doReturn`으로 스터빙됐다(spy 절의 문장과 다른 결과). `mockStatic` 범위 안에서는 `fake-now`, 새 스레드에서 호출하면 진짜 값 `real-now`, 범위를 닫은 뒤에도 `real-now`였다. 같은 스레드에서 닫지 않은 채 `mockStatic`을 한 번 더 호출하면 `MockitoException`이 났다. 처음 목을 만들 때 `Mockito is currently self-attaching to enable the inline-mock-maker` 경고와 JDK의 동적 에이전트 로딩 경고가 출력됐다. `Clock.fixed`를 주입받는 클래스는 고정 시각으로 만료 여부(`true`/`false`)를 판정했다.
(보충) 모킹이 필요한 static 호출을 설계 문제로 보고 의존성을 주입하라는 조언과 `Clock` 예시는 공식 문서에 있는 내용이 아니라 일반적인 설계 관행이다.
