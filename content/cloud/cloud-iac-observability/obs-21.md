---
slug: "obs-21"
topic: "cloud-iac-observability"
tier: TRICKY
difficulty: 3
title: "`kubectl rollout undo`로 롤백하면 무엇까지 이전 상태로 돌아가나요?"
keywords: ["파드 템플릿만 롤백", "스케일링은 리비전을 만들지 않음", "revisionHistoryLimit", "리비전 기록이 없으면 롤백 불가", "데이터베이스는 대상이 아님"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://kubernetes.io/docs/concepts/workloads/controllers/deployment/"]
concepts: [deploy-strategy, k8s-architecture]
importance: 1
links: [{to: "k8o-12", kind: RELATED}, {to: "k8s-09", kind: RELATED}]
---
**모범 답변 (30~60초)**
Deployment의 파드 템플릿만 이전 리비전의 것으로 되돌아갑니다. 리비전은 이미지나 레이블처럼 파드 템플릿이 바뀔 때만 생기고, 레플리카 수를 조정하는 스케일링은 리비전을 만들지 않으므로 롤백해도 레플리카 수는 되돌아가지 않습니다. 롤백할 수 있는 리비전은 `revisionHistoryLimit`만큼 남아 있는 이전 ReplicaSet이고 기본값은 10이며, 0으로 두면 이력이 모두 지워져 롤백할 수 없습니다. 데이터베이스 스키마나 이미 저장된 데이터는 이 롤백 범위 밖이라서, 스키마 변경이 포함된 배포는 이전 버전과의 호환성을 따로 고려해야 합니다.

(공식 문서) Kubernetes Deployment 문서는 Deployment의 리비전이 롤아웃이 트리거될 때, 즉 `.spec.template`(파드 템플릿)이 바뀔 때만 생성되고 스케일링 같은 다른 업데이트는 리비전을 만들지 않는다고 한다. 따라서 이전 리비전으로 롤백하면 파드 템플릿 부분만 롤백된다고 명시한다. 롤아웃 이력은 기본적으로 모두 보관되고, `.spec.revisionHistoryLimit`의 기본값은 10이며 0으로 명시하면 이력이 모두 정리되어 롤백할 수 없다고 한다. `kubectl rollout undo`와 `--to-revision` 사용 예도 있다.
(보충) 데이터베이스 스키마가 롤백 범위 밖이라는 부분은 위 문서가 롤백 범위를 파드 템플릿으로 한정한 서술에서 추론한 것이며, 해당 Deployment 문서에서 데이터베이스나 마이그레이션을 다루는 문장은 찾지 못했다(페이지 전체에서 해당 단어를 검색했다). 클러스터가 없어 실행해 보지 않았다(실험하지 않았다).
