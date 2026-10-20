---
slug: "ioc-03"
topic: "ioc-di"
tier: BASIC
difficulty: 1
title: "생성자가 하나뿐이면 @Autowired를 안 붙여도 되나요? 생성자가 여러 개면요?"
keywords: ["단일 생성자 암묵 주입", "required=true는 하나만", "required=false 다수 시 가장 많이 만족하는 생성자"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
생성자가 하나뿐이면 스프링이 그 생성자를 자동으로 사용하므로 @Autowired를 생략해도 됩니다. 생성자가 여러 개일 때는 @Autowired로 쓸 생성자를 표시해야 하고, required=true인 생성자는 하나만 허용됩니다. 여러 개를 표시하려면 모두 required=false여야 하고, 그 경우 스프링은 만족시킬 수 있는 의존성이 가장 많은 생성자를 고릅니다. 표시된 생성자가 없으면 기본(no-arg) 생성자 등으로 폴백합니다.

- (공식 문서) autowired 페이지의 생성자 해석 규칙을 정리한 것이다.
