---
slug: "ioc-04"
topic: "ioc-di"
tier: BASIC
difficulty: 1
title: "@Autowired는 어떤 순서로 주입할 빈을 찾나요? (타입 -> 한정자 -> 이름)"
keywords: ["타입 우선", "@Qualifier로 필터링", "@Primary 우선순위", "이름 폴백(마지막)", "@Resource는 이름 기반"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
@Autowired는 타입 기반입니다. 먼저 주입 지점의 타입에 할당 가능한 빈을 모두 모읍니다. 후보가 여러 개면 @Qualifier로 후보를 좁히고, 그래도 남으면 @Primary 같은 우선순위로 정합니다. 그래도 결정이 안 될 때 마지막 수단으로 필드명이나 파라미터명을 빈 이름과 비교합니다. 그래서 같은 타입 빈이 둘이고 힌트가 전혀 없으면 NoUniqueBeanDefinitionException이 납니다. 반대로 이름이 먼저인 것은 @Resource로, 이름으로 찾는 방식입니다.

- (공식 문서) @Autowired는 타입 중심이고 한정자와 이름은 타입 일치 후보를 좁히는 역할이다. 한정자/primary/fallback이 없을 때 주입 지점 이름을 빈 이름·별칭과 비교하는 것은 마지막 수단이다. 이름 폴백에는 6.1부터 `-parameters` 컴파일 옵션이 필요하다는 내용도 문서에 있다.
- (보충) 정확한 내부 단계(예: @Priority 처리 시점)는 문서의 자세한 서술과 구현이 다를 수 있으니 면접에서는 "타입 -> 한정자 -> primary -> 이름" 큰 흐름 위주로 답하는 것이 안전하다. NoUniqueBeanDefinitionException 예외명은 문서 본문에서 확인하지 않은 필자의 부연이다.
