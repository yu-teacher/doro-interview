---
slug: "alg-17"
topic: "cs-algorithm"
tier: TRICKY
difficulty: 3
title: "꼬리 재귀는 스택을 쓰지 않나요? 자바와 파이썬에서도 최적화되나요?"
keywords: ["꼬리 호출 최적화는 선택 사항", "스택 프레임 재사용", "자바·파이썬은 깊이 제한에 걸림", "컴파일러 최적화 수준에 의존", "반복문으로 직접 변환"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://xlinux.nist.gov/dads/HTML/tailRecursion.html", "https://docs.python.org/3/library/sys.html", "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/StackOverflowError.html"]
concepts: [recursion-dp]
importance: 1
---
**모범 답변 (30~60초)**
꼬리 재귀는 함수의 마지막 연산이 자기 호출인 재귀이고, 컴파일러가 원하면 그 호출을 현재 스택 프레임에서 실행해 새 프레임을 만들지 않게 최적화할 수 있습니다. 하지만 이것은 구현이 해 줄 수도 있는 최적화이지 코드를 꼬리 형태로 쓴다고 항상 일어나는 일이 아닙니다. 직접 돌려 본 자바 25와 파이썬 3.14에서는 꼬리 형태로 써도 깊이가 깊으면 각각 StackOverflowError와 RecursionError가 났고, C에서는 최적화 수준에 따라 달랐습니다. 깊이가 큰 입력이면 직접 반복문으로 바꾸는 것이 안전합니다.

(공식 문서) DADS tail recursion 항목은 마지막 연산이 재귀 호출인 특수한 재귀이며 호출을 현재 스택 프레임에서 실행하고 결과를 돌려주는 식으로 재귀가 최적화로 제거될 수 있다고 한다(may be optimized). 실행 시간은 크게 줄지 않아도 메모리는 많이 아낄 수 있다고 한다. Java SE 25 StackOverflowError와 Python sys 문서는 너무 깊은 재귀로 인한 스택 오버플로와 재귀 한도를 설명한다.
(실험 확인) 1부터 n까지 합을 꼬리 형태로 쓴 함수를 돌렸다. Corretto 25.0.3에서는 n = 10,000은 통과했지만 n = 100,000에서 StackOverflowError였다. Python 3.14.0에서는 모듈 최상위에서 호출했을 때 n = 999부터 RecursionError였다(기본 한도 1000). Apple clang 21의 C에서 n = 10⁸이 -O0 빌드는 종료 코드 139(세그먼트 오류)로 죽었고 -O2 빌드는 5000000050000000을 출력했다(macOS 8MB 스택 기준). 이 결과는 해당 도구 버전과 옵션에 한정된다.
(보충) 자바·파이썬·C 언어 사양이 꼬리 호출 최적화를 보장하는지는 사양 문서를 확인하지 않았고 위 관찰은 구현 동작이다.
