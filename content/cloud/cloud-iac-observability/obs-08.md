---
slug: "obs-08"
topic: "cloud-iac-observability"
tier: DEEP
difficulty: 2
title: "Terraform state를 원격 백엔드에 두고 잠금을 쓰는 이유는 무엇인가요?"
keywords: ["팀이 공유하는 최신 state", "동시 실행 방지 잠금", "버전 관리에 올리지 않기", "잠금 실패 시 중단", "force-unlock은 자기 잠금만"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://developer.hashicorp.com/terraform/language/state", "https://developer.hashicorp.com/terraform/language/state/remote", "https://developer.hashicorp.com/terraform/language/state/locking", "https://developer.hashicorp.com/terraform/language/backend/s3"]
concepts: [iac-terraform]
importance: 2
---
**모범 답변 (30~60초)**
기본인 로컬 state 파일은 팀에서 쓰기 어렵습니다. 각자 최신 파일을 가지고 있어야 하고 다른 사람이 동시에 실행하지 않는다는 보장도 없기 때문입니다. 그래서 S3 같은 원격 백엔드에 state를 두어 공유합니다. 잠금을 지원하는 백엔드에서는 state를 쓸 수 있는 작업을 할 때 자동으로 잠가 동시 실행으로 state가 깨지는 것을 막고, 잠금을 못 얻으면 작업이 진행되지 않습니다. state에는 비밀값이 들어갈 수 있어 Git에는 올리지 않는 게 좋고, 잠금이 풀리지 않았을 때의 `force-unlock`은 본인의 잠금에만 신중히 써야 합니다.

(공식 문서) Remote State 문서는 로컬 파일은 팀에서 각자 최신 state를 가졌는지, 동시에 실행하는 사람이 없는지 확인해야 해서 복잡하며, 원격 state는 팀 전체가 공유하는 저장소에 쓴다고 한다. 지원하는 백엔드는 잠금으로 동시 실행을 막을 수 있다고 한다.
(공식 문서) Locking 문서는 백엔드가 지원하면 state를 쓸 수 있는 모든 작업에서 자동으로 잠그며 잠금 실패 시 진행하지 않는다고 한다. `-lock=false`는 권장하지 않고, `force-unlock`은 자동 해제에 실패한 본인의 잠금에만 써야 하며 남의 잠금을 풀면 여러 쓰기 주체가 생길 수 있다고 한다. state 문서는 잠금과 접근 제어가 없는 곳(버전 관리 등)에 state를 두면 데이터 손실이나 비밀값 노출이 생길 수 있다고 경고한다.
(공식 문서) S3 백엔드 문서는 잠금이 선택 기능이며 `use_lockfile = true`로 켜고, 예전 방식인 DynamoDB 잠금은 deprecated라고 한다. 버킷 버전 관리를 켜 두라고 강하게 권장한다. 이 설정은 문서를 확인한 시점의 내용이며 Terraform 버전에 따라 달라질 수 있다.
원격 백엔드와 잠금을 실제로 구성해 보지 않았다(실험하지 않았다).
