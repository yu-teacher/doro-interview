---
slug: "rpc-20"
topic: "api-rpc"
tier: TRICKY
difficulty: 3
title: "proto3에서 `int32` 필드 값이 0이면 설정된 것인가요, 설정되지 않은 것인가요? `optional` 은 왜 쓰나요?"
keywords: ["기본값은 직렬화 안 됨", "0과 미설정 구분 불가", "optional로 존재 추적", "메시지 필드는 존재 추적", "에디션 이전 대비"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://protobuf.dev/programming-guides/proto3/", "https://protobuf.dev/programming-guides/field_presence/"]
concepts: [grpc-protobuf, null-handling]
importance: 1
links: [{to: "rpc-03", kind: PREREQ}]
---
**모범 답변 (30~60초)**
proto3의 기본(implicit) 필드는 값이 기본값 0이면 직렬화하지 않기 때문에, 0이 명시적으로 설정된 것인지 아예 보내지 않은 것인지 구분할 수 없습니다. `optional` 을 붙이면 명시적 존재 추적이 켜져서 값이 설정됐는지 확인할 수 있고, 설정된 필드는 0이어도 직렬화됩니다. 메시지 타입 필드는 처음부터 존재 여부가 추적됩니다. 공식 문서는 proto3 기본 타입 필드에 `optional` 을 기본으로 붙이기를 권장하는데, 에디션은 명시적 존재가 기본이라 이전이 수월하기 때문입니다. 부분 업데이트처럼 0이 유효한 값인 경우에 특히 필요합니다.

(공식 문서) proto3 가이드의 필드 카디널리티 절은 `optional` 필드가 설정됨/설정 안 됨 두 상태이고 설정 여부를 확인할 수 있다고 하며, 레이블 없는 implicit 필드(메시지 타입이 아닌 경우)는 기본값이면 직렬화되지 않고 기본값이 설정된 것인지 와이어에서 파싱된 것인지, 아예 제공되지 않은 것인지 알 수 없다고 한다. 메시지 타입 필드는 항상 존재 추적을 하며 `optional` 이 표현을 바꾸지 않는다고 한다. 에디션과의 호환을 위해 `optional` 을 권장한다.
(공식 문서) Field Presence 노트는 와이어 포맷이 존재하는 값의 나열일 뿐 존재하지 않는 값의 정보가 없다고 하고, implicit 규칙에서는 기본값이 곧 미존재와 같은 취급이라고 설명하며 기본 타입에 `optional` 을 권장한다. 에디션 API는 기본이 명시적 존재라고 한다.
(공식 문서) Field Presence 페이지의 병합 고려사항 절은 부분 "patch" 업데이트에서 존재가 추적되지 않으면 0 같은 기본값으로 바꾸는 신호를 보낼 수 없어 `FieldMask` 같은 별도 수단이 필요하다고 설명한다. protoc와 라이브러리가 없어 직렬화 결과를 실행해 확인하지는 못했다.
