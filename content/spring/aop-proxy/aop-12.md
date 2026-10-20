---
slug: "aop-12"
topic: "aop-proxy"
tier: DEEP
difficulty: 2
title: "CGLIB 프록시를 만들 때 생성자는 어떻게 되나요?"
keywords: ["Objenesis", "생성자 이중 호출 가능성", "생성자에 부수효과 금지"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
CGLIB 프록시 인스턴스는 Objenesis로 생성되기 때문에 생성자를 한 번 더 호출하지 않습니다. 그래서 보통 프록시 생성 때문에 생성자 부수효과가 중복되지는 않습니다. 다만 JVM이 생성자 우회를 허용하지 않는 환경이면 생성자가 두 번 호출되고 관련 디버그 로그가 두 번 나올 수 있다고 문서가 경고합니다. 생성자에 부수효과 로직을 넣지 말라는 이유 중 하나입니다.
