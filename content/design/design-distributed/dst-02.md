---
slug: "dst-02"
topic: "design-distributed"
tier: BASIC
difficulty: 1
title: "새 프로젝트를 처음부터 마이크로서비스로 시작하는 것이 좋은가요?"
keywords: ["마이크로서비스 프리미엄", "모놀리스 먼저", "경계를 잡기 어려움", "복잡도가 클 때만", "배포·모니터링 선결 조건"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://martinfowler.com/bliki/MicroservicePremium.html", "https://martinfowler.com/bliki/MonolithFirst.html", "https://martinfowler.com/bliki/MicroservicePrerequisites.html", "https://martinfowler.com/articles/microservices.html"]
concepts: [msa-boundary]
importance: 2
links: [{to: "arc-16", kind: RELATED}]
---
**모범 답변 (30~60초)**
대부분의 시스템은 모놀리스로 시작하는 편이 낫다는 것이 Fowler의 주장입니다. 마이크로서비스는 배포 자동화, 모니터링, 장애 처리, 최종 일관성 같은 부담, 즉 마이크로서비스 프리미엄을 내야 하고 이것이 개발 속도를 늦추므로, 모놀리스로 관리하기 어려울 만큼 복잡할 때만 고려하라고 합니다. 또 서비스 경계를 잘 잡아야 하는데 경험 많은 아키텍트도 초기에는 어렵고, 서비스 사이의 리팩터링은 모놀리스보다 훨씬 힘들다고 합니다. 그래서 모듈성을 지킨 모놀리스로 시작해 경계가 드러나면 나누는 방식을 권하지만, 본인도 사례가 적어 잠정적인 조언이라고 덧붙입니다.

(원저자 자료) Fowler의 "Microservice Premium"(2015-05-13)은 마이크로서비스가 자동 배포, 모니터링, 장애 대응, 최종 일관성 등 추가 복잡도를 가져오며 이것이 프로젝트 비용과 위험에 붙는 할증이라고 설명한다. 저자는 모놀리스로 관리하기에 너무 복잡한 시스템이 아니라면 마이크로서비스를 고려하지 말라는 것을 기본 지침으로 제시한다. "Monolith First"(2015-06-03)에서는 성공한 마이크로서비스 사례는 거의 다 커진 모놀리스를 쪼갠 것이고, 처음부터 마이크로서비스로 만든 시스템은 거의 다 심각한 곤란에 빠졌다고 자신이 들은 이야기를 근거로 말한다. 이유로 초기에는 서비스의 유용성조차 불확실하다는 점(YAGNI)과, 서비스 간 기능 이동이 모놀리스보다 훨씬 어려워 안정된 경계를 처음부터 긋기 어렵다는 점을 든다. 같은 글은 반대 논거(마이크로서비스 개발 리듬에 일찍 익숙해지고 팀을 서비스 경계로 나누기 쉽다)도 소개하며 증거가 적어 조언은 잠정적이라고 밝히고, 팀에 마이크로서비스 경험이 없다면 시작하지 말라는 쪽으로 기운다고 쓴다.
(원저자 자료) "Microservice Prerequisites"(2014-08-28)는 최소 조건으로 몇 시간 안의 빠른 서버 프로비저닝, 기본 모니터링, 빠른 애플리케이션 배포를 들고 개발과 운영의 긴밀한 협업을 요구한다. Fowler·Lewis의 글은 "모놀리스로 시작해 모듈성을 지키다 나누자"는 주장을 소개하면서도 인프로세스 인터페이스가 서비스 인터페이스로는 대개 좋지 않아 이상적인 조언은 아니라고 덧붙인다.
