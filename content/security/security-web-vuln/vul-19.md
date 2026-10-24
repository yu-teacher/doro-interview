---
slug: "vul-19"
topic: "security-web-vuln"
tier: TRICKY
difficulty: 3
title: "신뢰할 수 없는 데이터를 Java로 역직렬화하면 왜 위험하고, 어떻게 방어하나요?"
keywords: ["신뢰할 수 없는 데이터 역직렬화 회피", "직렬화 필터 허용 목록", "JSON 같은 단순 데이터 형식", "원격 코드 실행 가능성", "깊이와 크기 한도"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://cheatsheetseries.owasp.org/cheatsheets/Deserialization_Cheat_Sheet.html", "https://owasp.org/Top10/2021/A08_2021-Software_and_Data_Integrity_Failures/index.html", "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/io/ObjectInputFilter.html"]
concepts: [injection]
importance: 1
---
**모범 답변 (30~60초)**
Java 기본 직렬화 같은 네이티브 역직렬화는 JSON이나 XML보다 기능이 많아서, 신뢰할 수 없는 데이터를 읽으면 서비스 거부, 접근 제어 우회, 원격 코드 실행까지 이어질 수 있다고 OWASP는 설명합니다. JDK 문서도 이를 본질적으로 위험해 피해야 한다고 하므로, 외부 데이터는 객체 스트림 대신 JSON처럼 데이터만 담는 형식으로 받는 쪽을 먼저 고려합니다. 꼭 써야 한다면 JDK의 직렬화 필터로 기대하는 클래스만 허용하고 나머지는 거부하며, 객체 그래프의 깊이나 배열 길이, 바이트 수 한도를 함께 둡니다. 다만 필터가 있다고 해서 임의의 신뢰할 수 없는 데이터를 안전하게 읽을 수 있게 되는 것은 아닙니다.

```
no filter, Point        -> OK Point[x=1, y=2]
allowlist, Point        -> OK Point[x=1, y=2]
allowlist, ArrayList    -> InvalidClassException: filter status: REJECTED
직렬화 스트림 첫 4바이트(hex): aced0005
```

(원저자 자료) OWASP Deserialization Cheat Sheet는 네이티브 역직렬화 기능이 신뢰할 수 없는 데이터에서 악용되면 서비스 거부, 접근 제어, 원격 코드 실행 공격이 가능하다고 한다. 자바에 대해서는 직렬화 필터로 애플리케이션 전용 클래스 허용 목록과 자원 한도를 먼저 설정하라고 하고, 필터링이 임의의 신뢰할 수 없는 역직렬화를 안전하게 만들지는 않으며 필터는 구체적으로 인코딩된 문자열이나 원시 값에는 호출되지 않으니 입력 크기를 따로 제한하라고 한다. 직렬화 스트림 식별 패턴으로 16진수 `AC ED 00 05`, Base64 `rO0`를 든다. JSON 라이브러리도 jackson-databind는 다형성을 쓰지 않을 때, fastjson2는 autotype을 켜지 않을 때처럼 안전 조건이 라이브러리마다 다르다고 정리한다. JSON 같은 표준 형식을 쓰라는 직접적인 권고 문장은 PHP 항목에 있다.
(원저자 자료) OWASP Top 10:2021 A08 페이지는 공격자가 보고 수정할 수 있는 구조로 직렬화한 객체가 안전하지 않은 역직렬화에 취약하다고 하고, 서명이나 무결성 검사 없이 직렬화 데이터를 신뢰할 수 없는 클라이언트에 보내지 말라고 한다. 예로 Java 객체 시그니처 `rO0`를 보고 원격 코드 실행을 얻는 사례를 든다.
(공식 문서) Java SE 25 `ObjectInputFilter` 문서는 신뢰할 수 없는 데이터의 역직렬화는 본질적으로 위험하므로 피해야 한다고 경고하고, 클래스와 배열 길이·그래프 지표를 필터링하며 `example.*;java.base/*;!*` 같은 패턴으로 허용 클래스를 지정하고 나머지를 거부할 수 있다고 설명한다.
(실험 확인) JDK 25(Corretto 25.0.3)에서 `Deser$Point;java.lang.Record;java.lang.Object;!*` 패턴의 필터를 `ObjectInputStream`에 걸어, 허용한 `Point`는 복원되고 허용하지 않은 `ArrayList`는 `InvalidClassException`(filter status: REJECTED)으로 거부되는 것을 확인했다. 무해한 레코드와 컬렉션으로 필터 동작만 본 것이며 실제 공격 가능성이나 방어의 완전성을 확인한 것은 아니다.
