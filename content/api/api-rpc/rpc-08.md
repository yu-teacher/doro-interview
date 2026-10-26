---
slug: "rpc-08"
topic: "api-rpc"
tier: DEEP
difficulty: 2
title: "프로토콜 버퍼에서 필드 번호는 왜 중요하고, 필드를 삭제할 때는 어떻게 해야 하나요?"
keywords: ["와이어의 필드 식별자", "번호 변경은 삭제 후 추가", "번호 재사용 금지", "reserved로 예약", "1부터 15번은 1바이트"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://protobuf.dev/programming-guides/proto3/", "https://protobuf.dev/best-practices/dos-donts/", "https://protobuf.dev/programming-guides/encoding/"]
concepts: [grpc-protobuf]
importance: 2
links: [{to: "rpc-03", kind: PREREQ}, {to: "rpc-09", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
필드 번호는 와이어 포맷에서 필드를 식별하는 유일한 키라서, 메시지를 한번 쓰기 시작하면 바꿀 수 없습니다. 번호를 바꾸는 것은 필드를 지우고 같은 타입의 새 필드를 만드는 것과 같습니다. 특히 삭제한 번호를 다른 필드에 재사용하면 옛 데이터나 옛 서버가 새 정의로 잘못 해석돼 파싱 오류나 데이터 손상이 날 수 있습니다. 그래서 필드를 지울 때는 `reserved 2, 3;` 처럼 번호를 예약하고 필요하면 이름도 예약해 컴파일러가 재사용을 막게 합니다. 자주 쓰는 필드에는 1에서 15번을 배정하면 태그가 1바이트로 인코딩됩니다.

(공식 문서) proto3 가이드의 Assigning Field Numbers 절은 번호가 1부터 536,870,911 사이여야 하고 19,000에서 19,999는 구현용으로 예약돼 있으며, 사용 중인 메시지에서 번호를 바꾸면 필드를 삭제하고 새로 만드는 것과 같다고 한다. 재사용은 디코딩을 모호하게 해 파싱 오류, 개인정보 유출, 데이터 손상으로 이어질 수 있다고 경고하고, 1에서 15번은 1바이트, 16에서 2047번은 2바이트를 쓴다고 한다. Proto Best Practices는 번호 재사용 금지와 삭제 필드 번호 `reserved` 지정을 권고한다.
(실험 확인) 문서의 규칙을 손으로 구현한 최소 인코더(Python, protoc 없음)로 태그 길이를 확인했다. 필드 15번의 태그는 `78`(1바이트), 16번은 `8001`(2바이트), 2047번은 2바이트, 2048번은 3바이트였다. 필드 2를 정수 30으로 쓴 바이트에는 와이어 타입이 0(varint)으로 기록돼 있어, 필드 2를 문자열(길이 구분, 타입 2)로 재정의하면 와이어 타입이 맞지 않음을 확인했다. 실제 라이브러리가 이때 어떤 오류를 내는지는 실행하지 않았다.
