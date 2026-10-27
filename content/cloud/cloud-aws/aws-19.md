---
slug: "aws-19"
topic: "cloud-aws"
tier: TRICKY
difficulty: 3
title: "ALB 대상 그룹의 모든 대상이 헬스 체크에 실패하면 로드 밸런서는 트래픽을 어떻게 처리하나요?"
keywords: ["평소엔 정상 대상에만 라우팅", "모두 비정상이면 fail-open", "상태와 무관하게 전체 대상 전달", "헬스 체크 간격과 임계값", "대상 그룹 단위 설정"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.aws.amazon.com/elasticloadbalancing/latest/application/target-group-health-checks.html", "https://docs.aws.amazon.com/elasticloadbalancing/latest/application/introduction.html", "https://docs.aws.amazon.com/elasticloadbalancing/latest/userguide/how-elastic-load-balancing-works.html"]
concepts: [load-balancer, high-availability]
importance: 1
links: [{to: "aws-18", kind: PREREQ}, {to: "k8n-06", kind: RELATED}]
---
**모범 답변 (30~60초)**
평소에는 헬스 체크를 통과한 정상 대상에만 요청을 보내지만, 대상 그룹에 등록된 대상이 전부 비정상이면 상태와 무관하게 그 대상들 모두에 요청을 보냅니다. 문서는 이를 fail-open이라 부르고, 활성화된 모든 가용 영역의 대상이 동시에 헬스 체크에 실패해도 로드 밸런싱 알고리즘에 따라 전체 대상에 트래픽을 허용한다고 설명합니다. 헬스 체크는 대상 그룹 단위로 간격, 비정상 임계 횟수, 정상 임계 횟수를 설정하는데, 연속 실패가 비정상 임계값을 넘으면 서비스에서 빼고 연속 성공이 정상 임계값을 넘으면 복귀시킵니다. 그래서 헬스 체크 경로를 잘못 설정해 전부 실패해도 요청이 완전히 끊기지는 않으니, 이 상황은 지표 경보로 따로 감시해야 합니다.

(공식 문서) ALB 헬스 체크 페이지는 대상 그룹에 비정상 대상만 있으면 로드 밸런서가 상태와 관계없이 모든 대상에 요청을 보내며, 모든 활성 가용 영역의 모든 대상이 동시에 실패하면 fail-open이 되어 알고리즘에 따라 전체 대상으로 트래픽을 허용한다고 한다. 등록된 대상은 헬스 체크 한 번만 통과하면 정상이고, `HealthCheckIntervalSeconds`, `UnhealthyThresholdCount`, `HealthyThresholdCount` 설정에 따라 서비스에서 빠지고 복귀한다.
(공식 문서) ALB 소개 페이지는 헬스 체크가 대상 그룹 단위로 설정된다고 한다. ELB 사용 설명서의 동작 방식 페이지도 활성화된 모든 가용 영역의 모든 대상이 동시에 실패하면 로드 밸런서가 fail open 하고, NLB는 빈 대상 그룹일 때도 fail open 한다고 쓴다. 위 설정 이름과 기본값은 ALB 페이지 기준이다.
(보충) 지표 경보로 따로 감시하라는 부분은 문서의 권고가 아니라 이 동작에서 이끌어 낸 일반적 운영 요령이다.
실험하지 않았다. 클라우드 계정이 없어 문서 근거로만 썼다.
