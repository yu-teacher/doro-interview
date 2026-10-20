---
slug: "tst-20"
topic: "dev-test"
tier: TRICKY
difficulty: 3
title: "생성자 주입으로 설계하면 테스트가 어떻게 쉬워지고, `@InjectMocks`가 조용히 실패하는 때는 언제인가요?"
keywords: ["생성자 주입", "컨테이너 없이 new로 조립", "@InjectMocks 실패를 보고하지 않음", "가장 큰 생성자 선택", "찾지 못한 인자는 null"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/testing.html", "https://docs.spring.io/spring-framework/reference/testing/unit.html", "https://docs.spring.io/spring-framework/reference/testing/testcontext-framework/fixture-di.html", "https://javadoc.io/static/org.mockito/mockito-core/5.23.0/org.mockito/org/mockito/InjectMocks.html"]
---
**모범 답변 (30~60초)**
의존성을 생성자로 받으면 테스트에서 스프링도 Mockito 애노테이션도 없이 `new Service(fakeRepo, mail)`로 바로 조립할 수 있고, 필요한 협력자가 빠지면 컴파일러가 알려 줍니다. 스프링 문서도 IoC를 잘 쓰면 세터나 적절한 생성자 덕분에 테스트에서 객체를 쉽게 엮을 수 있다고 합니다. 반면 `@InjectMocks`는 생성자, 세터, 필드 순으로 주입을 시도하고 실패해도 오류를 보고하지 않습니다. 생성자 주입이면 가장 큰 생성자를 골라 테스트에 선언된 목으로 인자를 채우는데, 못 찾은 인자는 `null`로 들어가서 나중에 NPE가 날 수 있습니다. 그래서 필요한 목을 빠뜨리지 않았는지 확인하거나 직접 `new`로 만드는 편이 안전합니다.

(공식 문서) Spring Framework 테스트 장 소개는 IoC가 단위·통합 테스트를 쉽게 해 주며 세터 메서드와 적절한 생성자 덕분에 서비스 로케이터 없이 테스트에서 객체를 조립하기 쉽다고 한다. Unit Testing 절은 POJO를 `new`로 만들어 컨테이너 없이 테스트하라고 한다. `InjectMocks` Javadoc은 주입이 생성자, 프로퍼티 세터, 필드 순으로 시도되고 실패해도 Mockito가 실패를 보고하지 않으며, 생성자 주입에서는 가장 큰 생성자를 골라 테스트에 선언된 목으로 인자를 해결하고 찾을 수 없는 인자는 `null`이 전달된다고 설명한다. 반면 스프링 문서는 테스트 클래스에서는 인스턴스를 직접 만들지 않으므로 필드 주입이 자연스럽다고 한다.
(실험 확인) Mockito 5.23.0에서 생성자가 `Repo`와 `Mail`을 받는 `Svc`에 `@Mock Repo` 하나만 선언하고 `@InjectMocks`를 쓰니 `Svc` 객체는 만들어졌지만 `Mail`이 `null`이어서 `notify` 호출이 `NullPointerException`으로 실패했다. 필드 주입 대상(`Repo` 필드만 가진 클래스)은 정상 주입되었다. 같은 `Svc`를 인메모리 `Map` 페이크 `Repo`와 `new Mail()`로 직접 `new` 하니 Mockito 없이 `hi kim`과 `SENT:kim`을 얻었다. 다만 항상 조용히 실패하는 것은 아니어서, 생성자가 `(Repo, boolean)`이고 기본 생성자가 없는 클래스에 `@Mock Repo`만 선언하고 `@InjectMocks`를 쓰자 `Cannot instantiate @InjectMocks field ... has no default constructor`라는 `MockitoException`이 났다(`boolean`은 목으로 만들 수 없는 타입이라 생성자 주입이 일어나지 않는다는 Javadoc 설명과 맞는다).
(보충) 생성자 주입이면 필요한 협력자가 빠졌을 때 컴파일러가 알려 준다는 점과, 목 선언을 빠뜨리지 않았는지 확인하거나 직접 `new`로 조립하는 편이 안전하다는 조언은 위 문서에 있는 내용이 아니라 일반적인 설계·테스트 관행이다.
