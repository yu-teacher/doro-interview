---
slug: "obs-03"
topic: "cloud-iac-observability"
tier: BASIC
difficulty: 1
title: "Terraform state(상태 파일)는 무엇이고 왜 필요한가요?"
keywords: ["설정과 실제 리소스의 매핑", "의존 관계 메타데이터", "성능을 위한 속성 캐시", "기본은 terraform.tfstate 로컬 파일", "직접 수정하지 않는다"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://developer.hashicorp.com/terraform/language/state", "https://developer.hashicorp.com/terraform/language/state/purpose"]
concepts: [iac-terraform]
importance: 2
---
**모범 답변 (30~60초)**
state는 설정에 적은 리소스와 실제 클라우드에 있는 객체를 이어 주는 장부입니다. 설정의 `aws_instance.foo`가 실제 어떤 인스턴스 ID인지 state에 기록하기 때문에, 이후 설정이 바뀌면 그 객체를 수정하거나 삭제할 수 있습니다. 설정에서 리소스를 지웠을 때 올바른 삭제 순서를 알기 위한 의존 관계도 state에 남기고, 큰 인프라에서는 속성 값을 캐시해 성능도 높입니다. 기본값은 작업 디렉터리의 `terraform.tfstate` 파일이며, 이 JSON을 직접 편집하지 않고 `terraform state` 명령으로 다룹니다.

(공식 문서) state 문서는 state가 워크스페이스가 관리하는 인프라를 실제 리소스에 매핑하고 메타데이터를 기록하며 성능을 높이는 데 쓰인다고 한다. 기본 저장 위치가 `terraform.tfstate` 로컬 파일이고, JSON 파일을 직접 편집하지 말고 `terraform state` 명령을 쓰라고 한다.
(공식 문서) state 목적 문서는 태그 기반 매핑 같은 방식은 모든 리소스와 클라우드가 태그를 지원하지 않아 쓸 수 없었다고 설명하고, 설정에서 삭제된 리소스를 지울 때 순서를 알기 위해 의존 관계를 state에 보관한다고 한다. 속성 캐시는 가장 선택적인 기능이며 성능 개선용이라고 한다.
실제 state 파일을 만들어 보지 않았다(실험하지 않았다).
