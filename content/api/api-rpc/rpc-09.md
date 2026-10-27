---
slug: "rpc-09"
topic: "api-rpc"
tier: DEEP
difficulty: 2
title: "프로토콜 버퍼 메시지에 새 필드를 추가하면 옛 클라이언트와 서버는 어떻게 되나요? 호환이 깨지는 변경은 무엇인가요?"
keywords: ["모르는 필드는 건너뜀", "알 수 없는 필드 보존", "새 필드는 기본값", "번호 변경은 호환 깨짐", "타입 변경은 조건부 호환", "JSON은 이름 변경도 문제"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://protobuf.dev/programming-guides/proto3/", "https://protobuf.dev/best-practices/dos-donts/", "https://protobuf.dev/programming-guides/encoding/"]
concepts: [grpc-protobuf, api-versioning]
importance: 2
links: [{to: "apd-04", kind: RELATED}]
---
**모범 답변 (30~60초)**
필드를 추가해도 이전 버전과 호환됩니다. 옛 코드가 새 메시지를 파싱할 때 모르는 필드 번호는 건너뛰고 알던 필드만 읽으며, proto3 메시지는 이런 알 수 없는 필드를 보존했다가 다시 직렬화할 때 함께 내보냅니다. 새 코드가 옛 메시지를 읽으면 없는 필드는 기본값이 되므로 기본값의 의미를 고려해야 합니다. 필드 삭제와 enum 값 추가도 와이어 수준에서는 안전합니다. 반면 필드 번호 변경과 번호 재사용은 깨지는 변경이고, 타입 변경은 일부 타입 사이에서만 조건부로 호환되어 공식 가이드가 거의 하지 말라고 권고합니다. JSON이나 텍스트 형식으로 교환하면 이름 변경까지 문제가 됩니다.

(공식 문서) proto3 가이드의 Updating A Message Type 절은 필드 추가, 필드 제거, enum 값 추가를 바이너리 와이어 안전 변경으로, 필드 번호 변경을 불안전 변경으로 분류한다. 옛 바이너리는 새 필드를 무시하며 이것이 알 수 없는 필드가 되고, proto3도 알 수 없는 필드를 보존한다고 한다. 다만 JSON으로 직렬화하거나 필드를 순회해 새 메시지를 채우면 알 수 없는 필드가 사라진다고 한다. enum 값 추가는 모든 switch를 열거하는 코드에는 컴파일 오류가 될 수 있다고도 경고한다.
(공식 문서) proto3 가이드는 `int32`·`int64`·`bool` 같은 일부 타입 사이의 변경을 값이 잘릴 수 있는 조건부 호환으로 분류하고, Proto Best Practices는 필드 타입 변경을 거의 하지 말라고 하며, JSON·텍스트 형식에서는 필드나 enum 이름 변경으로 옛 코드의 파싱이 실패할 수 있다며 교환에는 바이너리를 쓰라고 권고한다.
(실험 확인) 재실행해 같은 결과를 확인했다. 필드 1,2만 아는 옛 파서를 손으로 구현해 필드 3까지 들어 있는 바이트를 읽히자, 1,2는 읽고 3은 와이어 타입의 길이 정보로 건너뛰었다. 알 수 없는 필드의 보존과 재직렬화는 확인하지 못했다(실제 라이브러리 없음).
