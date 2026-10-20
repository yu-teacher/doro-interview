---
slug: "alg-10"
topic: "cs-algorithm"
tier: DEEP
difficulty: 2
title: "재귀 함수에 베이스 케이스가 없거나 재귀가 너무 깊으면 어떻게 되고 어떻게 대응하나요?"
keywords: ["베이스 케이스", "호출마다 스택 프레임", "StackOverflowError", "파이썬 재귀 한도", "반복문이나 명시적 스택으로 변환"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://xlinux.nist.gov/dads/HTML/recursion.html", "https://xlinux.nist.gov/dads/HTML/tailRecursion.html", "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/StackOverflowError.html", "https://docs.python.org/3/library/sys.html"]
concepts: [recursion-dp, memory-layout]
importance: 3
links: [{to: "alg-11", kind: FOLLOWUP}, {to: "alg-17", kind: FOLLOWUP}, {to: "osm-03", kind: RELATED}]
---
**모범 답변 (30~60초)**
재귀는 함수가 문제의 일부를 직접 자기 자신에게 맡기는 기법이고, 더 이상 쪼갤 수 없어 바로 푸는 베이스 케이스와 문제를 줄여 다시 호출하는 재귀 케이스로 이루어집니다. 베이스 케이스에 도달하지 못하거나 깊이가 지나치면 호출마다 쌓이는 스택 프레임이 한계를 넘습니다. 자바는 StackOverflowError를 던지고 파이썬은 기본 재귀 한도를 두어 넘으면 예외를 냅니다. 대응은 종료 조건과 인자가 줄어드는지부터 확인하고, 깊이가 입력 크기에 비례하면 반복문이나 명시적 스택으로 바꾸거나 한도를 조심해서 늘리는 것입니다.

(공식 문서) DADS recursion 항목은 모든 재귀 해가 베이스 케이스와 재귀 케이스(나누기, 호출, 합치기)로 이루어진다고 한다. tail recursion 항목은 재귀 호출이 새 스택 프레임을 만든다고 전제하고 마지막 호출을 현재 프레임에서 실행하면 메모리를 아낄 수 있다고 한다. Java SE 25 StackOverflowError는 애플리케이션이 너무 깊게 재귀해서 스택 오버플로가 났을 때 던져진다고 한다. Python sys 문서는 재귀 한도가 무한 재귀로 C 스택이 넘쳐 인터프리터가 죽는 것을 막는 장치이며, 한도를 올리는 것은 플랫폼에 따라 한계가 있고 너무 높이면 충돌할 수 있다고 한다.
(실험 확인) Corretto 25.0.3에서 종료 조건 없는 재귀는 깊이 약 4만 3천~4만 6천(재실행 결과 43,187 등)에서 StackOverflowError가 났다(실행마다 달라지고 스택 크기 설정에 의존한다). Python 3.14.0의 기본 한도는 1000이었고 꼬리 형태로 쓴 합 함수가 900에서는 성공, 1000에서는 `RecursionError`였으며 한도를 20000으로 올리면 10000에서 성공했다.
(보충) 종료 조건과 인자가 줄어드는지부터 확인하고 반복문이나 명시적 스택으로 바꾼다는 대응 순서는 일반적인 권고이며 위 문서가 서술하지 않는다.
