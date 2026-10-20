---
slug: "arc-16"
topic: "design-principles"
tier: TRICKY
difficulty: 3
title: "'Monolith First' 주장은 무엇이고, 근거와 한계는 무엇인가요?"
keywords: ["모놀리스로 먼저 시작", "마이크로서비스 추가 비용", "서비스 경계를 처음부터 맞추기 어려움", "모듈형 설계 전제"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://martinfowler.com/bliki/MonolithFirst.html", "https://docs.spring.io/spring-modulith/reference/fundamentals.html", "https://docs.spring.io/spring-modulith/reference/verification.html"]
concepts: [msa-boundary]
importance: 2
links: [{to: "dst-02", kind: RELATED}]
---
**모범 답변 (30~60초)**
Monolith First는 Martin Fowler가 2015년 글에서 동료들의 논의를 정리해 내놓은 주장으로, 새 시스템은 마이크로서비스 대신 모놀리스로 시작하라는 것입니다. 그는 성공한 마이크로서비스 사례는 거의 모두 커진 모놀리스를 쪼갠 것이고, 처음부터 마이크로서비스로 만든 시스템은 거의 다 심각한 곤란을 겪었다는 이야기를 들었다고 합니다. 이유로 서비스 운영의 추가 비용, 아직 쓸모가 검증되지 않은 시점의 Yagni, 서비스 경계를 처음부터 맞추기 어렵고 서비스 간 리팩터링이 더 힘들다는 점을 듭니다. 다만 근거가 일화뿐이고 반대 주장도 있어 조언이 잠정적이라고 스스로 밝히며, 모듈성을 신경 써 설계하는 모놀리스는 논리적인 방법이지만 성공 사례를 충분히 듣지 못했다고 말합니다.

(원저자 자료) Martin Fowler, "Monolith First"(2015-06-03). 글은 성공한 마이크로서비스 이야기는 거의 모두 커진 모놀리스를 쪼갠 것이고, 처음부터 마이크로서비스로 만든 경우는 거의 모두 심각한 곤란에 빠졌다는 패턴을 저자가 들었다고 한다. 근거로 마이크로서비스 프리미엄이 팀을 늦춘다는 점, Yagni(아직 유용한지 모르는 시점), 서비스 경계가 안정적이어야 하는데 숙련된 설계자도 처음에 맞추기 어렵고 서비스 간 기능 이동은 모놀리스보다 훨씬 어렵다는 점을 든다. 모놀리스를 모듈성에 신경 써 설계하는 방식이 논리적이지만 성공 사례를 충분히 듣지 못했다고 하고, 반대 입장(처음부터 소규모 팀과 서비스 리듬에 익숙해지기)도 소개한다. 각주는 아무 시스템이나 마이크로서비스로 쪼갤 수 있는 것은 아니며 점진적 전환이 성공한 소수 사례도 상당히 좋은 모듈 설계가 전제였다고 한다. 글 말미 감사의 말에서 이 생각 상당 부분을 동료들에게서 가져왔다고 밝힌다. 저자는 이야기가 부족해 모든 조언이 잠정적이라고 적고, 팀에 마이크로서비스 경험이 없다면 처음부터 시작하지 말라고 느낀다고 쓴다.
(공식 문서) Spring Modulith 문서의 Fundamentals와 Verification 페이지는 모듈 경계 규칙을 `verify()`로 검사할 수 있다고 설명한다.
(보충) 모듈형 모놀리스를 Spring Modulith로 구현하는 것은 Fowler의 글이 직접 권한 것이 아니라 두 자료를 이어 붙인 설명이다.
