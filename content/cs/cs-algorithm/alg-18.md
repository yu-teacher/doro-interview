---
slug: "alg-18"
topic: "cs-algorithm"
tier: TRICKY
difficulty: 3
title: "이진 탐색에서 mid = (low + high) / 2 가 왜 버그가 될 수 있고, 못 찾았을 때 Arrays.binarySearch는 무엇을 반환하나요?"
keywords: ["low+high 정수 오버플로", "low + (high-low)/2", "부호 없는 시프트", "-(삽입 위치)-1 반환", "경계 off-by-one"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://xlinux.nist.gov/dads/HTML/binarySearch.html", "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/Arrays.html", "https://docs.python.org/3/library/bisect.html"]
concepts: [complexity-sorting, numeric-precision]
importance: 1
links: [{to: "jl-20", kind: RELATED}]
---
**모범 답변 (30~60초)**
low와 high가 둘 다 int 최댓값에 가까우면 low+high가 int 범위를 넘어 음수가 되고, 그 값을 2로 나눈 mid로 배열에 접근하면 잘못된 위치를 읽거나 예외가 납니다. 그래서 low + (high - low) / 2처럼 차이를 먼저 구해 계산하거나 부호 없는 오른쪽 시프트를 씁니다. 다만 low+high가 넘치려면 배열이 약 2³⁰개(10억 7천만 개 남짓) 이상이어야 해서 흔히 터지는 버그는 아닙니다. 자바 Arrays.binarySearch는 못 찾으면 -(삽입 위치) - 1을 돌려줘서 항상 음수이고, 파이썬 bisect는 삽입 위치를 그대로 돌려줍니다.

(공식 문서) DADS binary search 항목은 mid = (high + low)/2가 high와 low가 표현 가능한 최댓값에 가까우면 넘치며, low + (high - low)/2는 둘이 음이 아니면 넘치지 않고 결과가 같다고 한다. Java SE 25 Arrays.binarySearch 문서는 키가 있으면 그 인덱스를, 없으면 (-(insertion point) - 1)을 돌려주며 삽입 위치는 키가 배열에 삽입될 지점이라고 정의한다. Python bisect 문서는 bisect_left/right가 삽입 위치를 돌려준다고 한다.
(실험 확인) Corretto 25.0.3에서 low = 2147483637, high = 2147483645일 때 (low+high)/2는 -7이었고 low+(high-low)/2와 (low+high)>>>1은 둘 다 2147483641이었다. 배열 [10,20,30,40]에서 25를 찾으면 -3(삽입 위치 2), 5는 -1, 99는 -5였다. 10억 개 크기의 실제 배열로 버그를 재현하려는 시도는 힙 512MB에서 OutOfMemoryError라 하지 못했다.
(보충) "배열이 약 2³⁰개 이상이어야 low+high가 넘친다"는 위 int 범위(최댓값 2³¹-1)에서 계산한 일반적 추론이다.
