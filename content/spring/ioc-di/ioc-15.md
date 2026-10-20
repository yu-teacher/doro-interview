---
slug: "ioc-15"
topic: "ioc-di"
tier: DEEP
difficulty: 2
title: "순환 의존성이란 무엇이고, 생성자 주입에서는 어떻게 되나요?"
keywords: ["상호 의존", "생성자 순환 -> BeanCurrentlyInCreationException", "세터로 완화 가능하나 비권장", "설계 개선", "시작 시점에 감지"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
A가 B를, B가 A를 필요로 하는 상호 의존 구조입니다. 둘 다 생성자 주입이면 어느 쪽도 먼저 만들 수 없기 때문에 컨테이너가 순환을 감지하고 시작 단계에서 예외를 던집니다. 실제로는 `UnsatisfiedDependencyException`으로 감싸져 나오고, 그 원인(root cause)이 `BeanCurrentlyInCreationException`입니다. 공식 문서는 해결책으로 한쪽 또는 양쪽을 세터 주입으로 바꾸라고 하지만, 세터 주입으로 순환을 허용하는 것은 권장하지 않는다고 덧붙입니다. 세터 방식은 한 빈이 완전히 초기화되기 전에 다른 빈에 주입되기 때문입니다. 근본적으로는 책임을 재설계해 순환 자체를 없애는 것이 좋습니다. 순환이 없는 그래프에서는 각 협력 객체가 완전히 구성된 후 주입됩니다.

- (공식 문서) 위 모든 내용. 컨테이너가 로딩 시점에 순환 의존 같은 구성 문제를 검증하고, 싱글톤은 기본적으로 미리 인스턴스화되므로 대부분 오류가 시작 시점에 드러난다는 점도 문서에 있다.
- (실험 확인) 생성자 순환의 최상위 예외는 `UnsatisfiedDependencyException`이고 `BeanCurrentlyInCreationException`은 그 원인으로 붙어 있다. 면접에서는 "`BeanCurrentlyInCreationException`(보통 `UnsatisfiedDependencyException`으로 감싸져서 나온다)"처럼 답하면 정확하다. 한쪽에 `@Lazy`를 붙이면 생성자 순환도 풀린다. 확인 테스트: `experiment/ioc/CircularDependencyExperimentTest`.
