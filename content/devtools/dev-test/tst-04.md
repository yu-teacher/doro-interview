---
slug: "tst-04"
topic: "dev-test"
tier: BASIC
difficulty: 1
title: "Mock, Stub, Fake, Spy는 각각 무엇이고 어떻게 구분하나요?"
keywords: ["테스트 더블", "스텁은 미리 정한 값 반환", "목은 호출 검증", "페이크는 단순화한 구현체", "스파이는 실제 객체 감싸기"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://javadoc.io/static/org.mockito/mockito-core/5.23.0/org.mockito/org/mockito/Mockito.html", "https://docs.spring.io/spring-framework/reference/testing/unit.html"]
---
**모범 답변 (30~60초)**
모두 진짜 협력 객체 대신 쓰는 테스트 더블입니다. 스텁은 호출되면 미리 정한 값을 돌려주는 대역이고, 목은 어떤 메서드가 어떤 인자로 몇 번 호출됐는지 검증하는 데 쓰는 대역입니다. 페이크는 인메모리 저장소처럼 실제로 동작하지만 단순화한 구현체이고, 스파이는 실제 객체를 감싸서 진짜 메서드를 실행하면서 호출 기록도 남깁니다. Mockito에서는 `mock()`으로 만든 객체에 `when().thenReturn()`을 걸면 스텁처럼, `verify()`로 확인하면 목처럼 쓰는 것이고, `spy()`는 실제 객체를 감쌉니다.

(공식 문서) Mockito Javadoc은 `mock()`으로 만든 객체에 스터빙(`when`)과 검증(`verify`)을 모두 할 수 있다고 하고, 스파이는 실제 객체에 대한 부분 목이라서 스터빙하지 않은 메서드는 진짜 메서드가 호출된다고 설명한다. Spring Framework 테스트 장도 서비스 계층을 리포지토리 인터페이스의 스텁이나 목으로 검증할 수 있다고 한다.
(실험 확인) Mockito 5.23.0에서 `mock(Mail.class).send("a")`는 `null`, `spy(new Mail()).send("a")`는 실제 구현의 `SENT:a`를 돌려줬다. `spy(new ArrayList<String>())`에 `add("one")` 했을 때 spy의 `size()`는 1이었지만 원본 리스트의 `size()`는 0이었다. 인메모리 `Map`으로 직접 만든 페이크 `Repo`는 Mockito 없이 서비스에 넣어 `hi kim`을 얻었다.
(보충) Mock, Stub, Fake, Spy라는 분류와 정의는 공식 문서가 아니라 테스트 더블에 대한 일반 용어이고, 책과 글마다 경계를 조금씩 다르게 쓴다. 특히 Mockito에서는 목 하나가 스텁과 목 역할을 겸한다.
