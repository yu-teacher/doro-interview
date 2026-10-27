---
slug: "aut-13"
topic: "security-auth"
tier: DEEP
difficulty: 2
title: "RBAC와 ABAC는 무엇이 다르고, 각각 언제 한계를 만나나요?"
keywords: ["역할에 권한을 묶는 RBAC", "속성과 정책으로 판단하는 ABAC", "역할 폭발", "객체 단위 접근 제어", "기본 거부와 매 요청 검증"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html"]
concepts: [access-control]
importance: 2
links: [{to: "vul-09", kind: RELATED}, {to: "sec-06", kind: RELATED}]
---
**모범 답변 (30~60초)**
RBAC는 권한을 역할에 묶고 사용자에게 역할을 부여하는 모델로, 오래전부터 널리 쓰였고 초기 구축은 보통 ABAC보다 단순합니다. ABAC는 사용자와 객체의 속성, 시간 같은 환경 조건을 정책으로 평가해 판단하는 모델입니다. 역할이 너무 많아지는 역할 폭발이 생기거나, 객체 단위 규칙이나 여러 요소를 함께 보는 규칙이 필요하면 RBAC는 버겁습니다. 반대로 ABAC는 속성을 일관되게 정의해야 효과가 납니다. OWASP는 애플리케이션 개발에서 대개 ABAC나 관계 기반 모델을 우선하라고 권고합니다. 어느 모델이든 기본 거부로 시작해 모든 요청마다 검사해야 합니다.

(원저자 자료) OWASP Authorization Cheat Sheet는 RBAC를 역할에 따라 접근을 허용하거나 거부하는 모델로, ABAC를 주체·객체의 속성과 환경 조건과 정책으로 판단하는 모델로 설명하고(NIST SP 800-162 인용), 관계 기반 ReBAC도 소개한다. 시트는 ABAC와 ReBAC가 대체로 RBAC보다 우선되어야 한다고 권고하며 그 이유로 세밀한 객체 단위 판단, 역할 폭발(역할이 너무 많아지는 상황), 다중 테넌트 지원을 든다. RBAC는 오랜 역사가 있고 여전히 인기가 있으며 초기 설정은 ABAC보다 단순한 경우가 많지만 규모가 커지면 그 이점이 사라진다고 한다. ABAC는 속성이 일관되게 정의되어야 한다는 전제가 붙는다. 또 기본 거부(Deny by Default)와 모든 요청마다의 권한 검증, 서버 측(또는 게이트웨이·서버리스 함수) 검사를 강조한다. 객체 단위 예시(작성자만 글 수정)는 시트에서 ReBAC의 예로 나온다. 이 권고는 OWASP의 의견이므로 단순한 RBAC로 충분한 서비스도 있다.
