---
slug: "obs-16"
topic: "cloud-iac-observability"
tier: DEEP
difficulty: 2
title: "무중단 배포 전략인 롤링 업데이트, 블루/그린, 카나리는 각각 어떤 방식이고 롤백은 어떻게 하나요?"
keywords: ["롤링은 점진 교체", "블루그린은 트래픽 전환", "카나리는 일부 트래픽만 새 버전", "롤백은 이전 버전으로 되돌리기", "오류 예산 보호"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://kubernetes.io/docs/concepts/workloads/controllers/deployment/", "https://sre.google/workbook/canarying-releases/"]
concepts: [deploy-strategy]
importance: 3
links: [{to: "k8s-09", kind: RELATED}, {to: "cic-14", kind: RELATED}]
---
**모범 답변 (30~60초)**
롤링 업데이트는 이전 버전 파드를 조금씩 줄이고 새 버전을 조금씩 늘려 가며 교체하는 방식으로, 쿠버네티스 Deployment의 기본 전략입니다. 블루/그린은 현재 서비스하는 환경 옆에 새 버전 환경을 준비해 두고 트래픽을 그쪽으로 옮기며, 롤백은 라우팅을 되돌리면 되지만 자원이 두 배로 듭니다. 카나리는 운영 트래픽의 일부만 새 버전에 보내 결함을 일찍 발견하는 것으로, SRE 워크북의 단순한 모델에서는 결함이 오류 예산에 주는 영향이 노출된 트래픽 비율에 비례합니다. 쿠버네티스 롤링에서는 `kubectl rollout undo`로 이전 리비전으로 되돌릴 수 있습니다.

(공식 문서) Kubernetes Deployment 문서는 `.spec.strategy.type`이 `RollingUpdate`(기본값) 또는 `Recreate`이고, `RollingUpdate`는 이전 ReplicaSet을 줄이고 새 것을 늘리며 `maxUnavailable`과 `maxSurge`로 속도를 조절한다고 한다. 두 값의 기본값은 25%이고, `Recreate`는 기존 파드를 모두 종료한 뒤 새 파드를 만든다고 한다.
(원저자 자료) SRE 워크북 Canarying Releases는 카나리를 운영 트래픽 일부만 새 릴리스에 노출하는 방식으로 설명하고, 한 번에 전체 배포하면 결함도 그대로 퍼지므로 안전한 대안이라고 한다. 결함의 오류 예산 영향이 노출된 트래픽 비율에 비례한다고 설명하며, 이는 부하가 균일하다고 가정한 단순한 모델이라고 밝힌다. 블루/그린은 두 인스턴스를 유지해 트래픽을 옮기고, 다운타임 없이 전환되며 롤백은 라우터 변경을 되돌리는 것이지만 자원이 두 배로 든다고 한다.
클러스터가 없어 실제로 배포해 보지 않았다(실험하지 않았다).
