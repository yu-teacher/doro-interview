---
slug: "apd-04"
topic: "api-practice"
tier: BASIC
difficulty: 2
title: "API 변경 중 하위 호환 변경과 깨지는 변경은 어떻게 구분하나요?"
keywords: ["같은 메이저 버전 안에서 호환", "필드·메서드 추가는 대체로 호환", "제거와 이름 변경은 깨짐", "새 필수 요청 필드 금지", "타입·기본값·의미 변경"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://google.aip.dev/180", "https://raw.githubusercontent.com/microsoft/api-guidelines/vNext/graph/Guidelines-deprecated.md"]
concepts: [api-versioning]
importance: 3
links: [{to: "apd-16", kind: FOLLOWUP}, {to: "apd-17", kind: FOLLOWUP}, {to: "rpc-09", kind: RELATED}, {to: "rpc-15", kind: RELATED}]
---
**모범 답변 (30~60초)**
같은 메이저 버전 안에서 기존 클라이언트가 수정 없이 계속 동작하는지를 기준으로 나눕니다. Google AIP-180에 따르면 새 메서드나 필드 같은 구성요소는 같은 메이저 버전에 더할 수 있지만, 이전 표면만 아는 코드가 전과 같이 동작해야 하고 새 필수 요청 필드는 안 됩니다. 필드나 메서드를 제거하거나 이름을 바꾸는 것, 필드 타입을 바꾸는 것, 기본값을 바꾸는 것은 깨지는 변경입니다. 형태가 같아도 기존 코드가 기대하던 동작이나 값의 형식이 달라지면 의미 호환성이 깨진 것으로 봅니다. Microsoft 가이드라인도 API나 파라미터의 제거·이름 변경, 동작과 오류 코드의 변경을 깨지는 변경의 예로 듭니다.

(공식 문서) AIP-180은 호환성을 소스·와이어·의미 세 종류로 나누고, 새 마이너·패치 릴리스가 기존 클라이언트를 깨면 안 된다고 한다. 구성요소 추가는 허용하되 이전 표면만 아는 코드가 전과 같이 취급돼야 하고 새 필수 요청 필드는 안 된다고 한다. 제거는 같은 메이저 버전에서 금지, 이름 변경은 제거와 추가의 합으로 본다. 필드 타입은 와이어 호환이어도 바꾸면 안 되고, 정적 기본값과 직렬화 방식을 바꾸는 것도 깨지는 변경이라고 한다. 문서가 판단이 필요한 경우가 있고 목록은 예시이며, 여러 언어의 불특정 소비자를 가정한 지침이라고 밝힌다. Microsoft 가이드라인 12.3은 깨지는 변경의 분명한 예로 API·파라미터 제거나 이름 변경, 기존 API의 동작 변경, 오류 코드와 오류 계약의 변경을 든다.
(실험하지 않았다) 문서 근거만으로 적었다.
