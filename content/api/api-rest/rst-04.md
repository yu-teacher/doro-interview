---
slug: "rst-04"
topic: "api-rest"
tier: BASIC
difficulty: 1
title: "REST API 의 리소스 URI 는 어떻게 설계하나요? 명사, 복수형, 계층은 왜 그렇게 하나요?"
keywords: ["리소스는 명사", "컬렉션은 복수형", "컬렉션과 ID가 번갈아 나오는 계층", "동작은 HTTP 메서드로 표현", "DB 스키마를 그대로 노출하지 않기"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm", "https://google.aip.dev/121", "https://google.aip.dev/122", "https://raw.githubusercontent.com/microsoft/api-guidelines/vNext/graph/Guidelines-deprecated.md", "https://raw.githubusercontent.com/microsoft/api-guidelines/vNext/graph/GuidelinesGraph.md"]
concepts: [rest-design]
importance: 3
links: [{to: "rst-05", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
URI는 동작이 아니라 리소스를 가리키는 이름이어서 명사로 짓습니다. 가이드라인들은 컬렉션 이름을 줄이지 않은 복수형으로 쓰고, `/users/123/orders/7`처럼 컬렉션과 ID가 번갈아 나오는 계층으로 리소스 사이의 관계를 드러내는 형태를 권합니다. 무엇을 할지는 URI의 동사가 아니라 GET, POST 같은 HTTP 메서드가 말해 줍니다. 다만 복수형이나 계층 규칙은 REST의 필수 조건이 아니라 가이드라인의 권고입니다. 또 Google은 API가 내부 DB 스키마와 똑같아지면 둘이 강하게 묶이는 안티패턴이라고 하므로, 리소스는 테이블이 아니라 사용자가 이해하는 개념 단위로 설계합니다.

(원저자 자료) Google AIP-122는 컬렉션 식별자가 명사의 복수형이어야 하고, 리소스 이름의 구성 요소가 컬렉션 식별자와 리소스 ID로 번갈아 나오는 형태(예: `publishers/123/books/les-miserables`)라고 한다. 리소스 이름은 DNS 이름에서 쓸 수 있는 문자 위주로 하고 URL 이스케이프가 필요한 문자나 ASCII 밖의 문자는 피하라고 한다. AIP-121은 리소스를 명사로, 리소스 위의 표준 메서드를 동사로 보는 설계를 설명하고, API가 내부 DB 스키마와 같은 것은 표면을 하부 시스템에 단단히 묶는 안티패턴이라고 한다.
(원저자 자료) Microsoft REST API Guidelines(비권장 표시 문서)는 URL을 사람이 쉽게 읽고 만들 수 있어야 한다고 하고, 컬렉션 이름은 줄이지 않은 복수형이며 컬렉션 항목 아래에 다른 컬렉션이 중첩될 수 있다고 한다(예: `people/123/addresses`). Microsoft Graph 가이드는 리소스를 보통 명사로 서술하고 컬렉션에는 복수 명사를 쓰라고 한다.
(원저자 자료) Fielding 논문 5.2.1.1은 리소스 식별자를 정하는 쪽이 매핑의 의미를 오래 유지할 책임이 있다고 할 뿐이다. 5장에서 URI의 복수형이나 동사 사용 규칙은 찾지 못했다(검색어 verb, plural, noun). 이 질문은 개념 설명이라 실험하지 않았다.
