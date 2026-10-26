---
slug: "aws-22"
topic: "cloud-aws"
tier: BASIC
difficulty: 1
title: "AWS Well-Architected Framework의 6가지 기둥은 무엇인가요?"
keywords: ["운영 우수성", "보안", "안정성", "성능 효율성", "비용 최적화", "지속 가능성"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.aws.amazon.com/wellarchitected/latest/framework/the-pillars-of-the-framework.html", "https://docs.aws.amazon.com/wellarchitected/latest/framework/general-design-principles.html", "https://docs.aws.amazon.com/wellarchitected/latest/framework/operational-excellence.html", "https://docs.aws.amazon.com/wellarchitected/latest/framework/security.html", "https://docs.aws.amazon.com/wellarchitected/latest/framework/reliability.html", "https://docs.aws.amazon.com/wellarchitected/latest/framework/performance-efficiency.html", "https://docs.aws.amazon.com/wellarchitected/latest/framework/cost-optimization.html", "https://docs.aws.amazon.com/wellarchitected/latest/framework/sustainability.html"]
concepts: [high-availability]
importance: 1
---
**모범 답변 (30~60초)**
운영 우수성, 보안, 안정성, 성능 효율성, 비용 최적화, 지속 가능성의 여섯 가지입니다. 운영 우수성은 팀을 꾸리고 워크로드를 설계, 운영, 개선하는 일이고, 보안은 데이터와 시스템과 자산을 보호하는 일입니다. 안정성은 워크로드가 의도한 기능을 올바르고 일관되게 수행하는 능력이고, 성능 효율성은 자원을 효율적으로 써서 성능 요구를 만족하고 유지하는 것입니다. 비용 최적화는 가장 낮은 가격으로 비즈니스 가치를 내는 것이고, 지속 가능성은 에너지 소비와 효율 같은 환경 영향에 주목합니다. 문서는 이 기둥을 소홀히 하면 기대에 맞는 시스템을 만들기 어렵다고 하며, 일반 설계 원칙으로 용량 추측 중단과 자동화를 듭니다.

(공식 문서) 프레임워크 기둥 페이지는 여섯 기둥(운영 우수성, 보안, 안정성, 성능 효율성, 비용 최적화, 지속 가능성)을 나열하고, 이를 소홀히 하면 기대하는 시스템을 만들기 어렵다고 한다. 기둥별 페이지는 운영 우수성(팀 구성·워크로드 설계·운영·발전), 보안(데이터·시스템·자산 보호), 안정성(의도한 기능을 올바르고 일관되게 수행), 성능 효율성(자원을 효율적으로 사용), 비용 최적화(가장 낮은 가격으로 가치 제공), 지속 가능성(에너지 소비와 효율 같은 환경 영향)을 정의한다.
(공식 문서) 일반 설계 원칙 페이지는 용량 추측 중단, 프로덕션 규모 테스트, 실험을 염두에 둔 자동화, 진화하는 아키텍처, 데이터 기반 설계, 게임 데이의 여섯 가지를 든다. 기둥별 세부 설계 원칙과 모범 사례는 읽지 않았다.
실험하지 않았다. 클라우드 계정이 없어 문서 근거로만 썼다.
