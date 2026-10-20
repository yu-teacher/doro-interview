---
slug: "ioc-19"
topic: "ioc-di"
tier: TRICKY
difficulty: 3
title: "@Resource와 @Autowired는 무엇이 다른가요?"
keywords: ["타입 기반 vs 이름 기반", "JSR-250", "적용 위치 차이", "required 유무"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
@Autowired는 스프링 애노테이션으로 타입 기반이고 한정자와 이름은 후보를 좁히는 보조 수단입니다. @Resource는 JSR-250 표준으로 이름 기반이며 지정한 이름의 컴포넌트를 찾습니다. @Autowired는 필드, 생성자, 다중 인자 메서드에 쓸 수 있고 required 속성이 있지만, @Resource는 필드와 단일 인자 세터에만 쓸 수 있고 required가 없습니다. 생성자 주입에서 한정이 필요하면 @Autowired와 @Qualifier를 조합합니다.

- (공식 문서) 한정자 페이지의 두 애노테이션 비교와 autowired 페이지의 설명.
