---
slug: "alg-11"
topic: "cs-algorithm"
tier: DEEP
difficulty: 2
title: "메모이제이션(top-down)과 타뷸레이션(bottom-up)은 어떻게 다르고 각각 언제 유리한가요?"
keywords: ["재귀와 캐시", "반복문으로 표 채우기", "필요한 부분문제만 계산", "재귀 깊이 한계", "중복 계산 제거"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://xlinux.nist.gov/dads/HTML/memoize.html", "https://xlinux.nist.gov/dads/HTML/dynamicprog.html", "https://docs.python.org/3/library/functools.html"]
---
**모범 답변 (30~60초)**
둘 다 같은 부분문제를 다시 계산하지 않도록 결과를 저장해 동적 계획법을 만드는 방법입니다. 메모이제이션은 재귀 구조를 그대로 두고 계산 결과를 캐시해 두었다가 같은 인자가 오면 꺼내 쓰는 방식이라 구현이 쉽고 실제로 필요한 부분문제만 계산합니다. 타뷸레이션은 작은 문제부터 반복문으로 표를 채워 올라가는 방식이라 재귀 깊이 한계나 호출 오버헤드가 없습니다. 피보나치처럼 지수 시간 재귀가 메모로 선형 시간이 되는 것이 대표적인 효과입니다. 파이썬에서는 functools.cache가 메모이제이션을 한 줄로 붙여 줍니다.

(공식 문서) DADS memoization 항목은 계산한 답을 저장해 나중에 재사용하는 기법이라고 정의하고, 순진한 피보나치가 Ω(1.6ⁿ)인데 메모이제이션하면 Θ(n)이 된다고 한다. dynamic programming 항목은 부분문제 해를 캐시(메모이제이션)해서 최적화 문제를 푸는 것이라고 한다. Python functools.cache 문서는 이를 가볍고 무제한인 함수 캐시이며 "memoize"라고도 부른다고 한다.
(실험 확인) Python 3.14.0에서 순진한 fib(30) 호출은 1,664,079번(= 2·fib(30)-1)이었고 dict 메모를 쓴 재귀는 57번 호출·메모 항목 28개였으며 표 방식은 반복 28회였다. 재귀 한도 1000에서 메모 재귀 fib(2000)은 `RecursionError`가 났고 표 방식은 계산됐다. 동전 [10,25]로 1000원을 만드는 문제는 top-down이 방문한 부분문제가 198개로 표 크기 1001보다 적었다.
(보충) "타뷸레이션"이라는 이름, 메모이제이션은 필요한 부분문제만 계산하고 표 방식은 재귀 깊이 한계와 호출 오버헤드가 없다는 장단점 구분은 일반적 설명이다(위 문서는 메모이제이션과 동적 계획법을 정의할 뿐 bottom-up 표 방식을 따로 설명하지 않는다).
