---
slug: "aop-13"
topic: "aop-proxy"
tier: DEEP
difficulty: 2
title: "@Transactional이 프록시로 동작하는 이유는? (연결만)"
keywords: ["선언적 트랜잭션", "프록시가 begin/commit/rollback", "프록시 한계 상속"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
`@Transactional`은 AOP의 대표적인 적용 사례입니다. 트랜잭션 시작/커밋/롤백을 프록시가 메서드 호출 앞뒤에서 처리해 주기 때문에 비즈니스 코드에는 트랜잭션 코드가 없습니다. 그래서 프록시 한계가 그대로 적용됩니다. 자기 호출, final/private 메서드에서는 트랜잭션이 안 걸립니다. 자세한 전파/격리/롤백 규칙은 트랜잭션 문서에서 다룹니다.

- 공식 문서(AOP 개요): Spring이 AOP로 제공하는 가장 중요한 서비스가 선언적 트랜잭션 관리라고 명시한다. 트랜잭션 세부 내용은 별도 문서에서 다룬다 (예: `docs/interview/` 내 트랜잭션 문서).
- 실험: TxExperimentTest 의 `트랜잭션_안에서_예외가_나면_전부_롤백된다`, `트랜잭션이_없으면_예외가_나도_저장된_것은_남는다`, `자기호출은...` 세 테스트를 함께 보면 프록시 유무에 따른 차이가 드러난다.
