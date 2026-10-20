---
slug: "alg-06"
topic: "cs-algorithm"
tier: BASIC
difficulty: 1
title: "이진 탐색은 어떤 조건에서 쓸 수 있고 시간 복잡도는 얼마인가요?"
keywords: ["정렬된 입력 전제", "구간을 절반으로 축소", "O(log n) 비교", "임의 접근", "중복 값 위치 비보장"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://xlinux.nist.gov/dads/HTML/binarySearch.html", "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/Arrays.html", "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/Collections.html"]
concepts: [complexity-sorting]
importance: 3
links: [{to: "alg-18", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
이진 탐색은 정렬된 배열에서 구간의 가운데 값과 찾는 값을 비교해 구간을 절반씩 줄여 가는 탐색이고, 비교 횟수가 O(log n)입니다. 입력이 정렬돼 있어야 한다는 것이 전제 조건이고, 정렬되지 않았다면 결과가 정의되지 않습니다. 가운데 원소를 상수 시간에 읽는 임의 접근 리스트에서 O(log n) 시간에 동작합니다. 정렬된 연결 리스트에서도 쓸 수 있지만 순회가 O(n)번이라 선형 탐색과 같고 줄어드는 것은 비교 횟수뿐입니다. 같은 값이 여럿이면 그중 어느 것을 찾을지는 보장되지 않습니다.

(공식 문서) DADS binary search 항목은 정렬된 배열의 탐색 구간을 반복해서 반으로 나누는 탐색이라고 정의하고, 정렬된 연결 리스트에서도 쓸 수 있지만 순회가 O(n)번이고 비교는 O(log n)번이라고 한다. Java SE 25 Collections.binarySearch는 임의 접근(random access) 리스트에서는 log(n) 시간에 동작하고, RandomAccess가 아니고 큰 리스트면 반복자 기반으로 O(n) 링크 순회와 O(log n) 비교를 한다고 하고, Arrays.binarySearch는 정렬되지 않은 입력의 결과는 정의되지 않으며(undefined) 같은 값이 여럿이면 어느 것이 발견될지 보장이 없다고 한다.
(실험 확인) 직접 구현한 이진 탐색(Python 3.14.0)의 최악 탐침 횟수는 n = 10에서 4, n = 1000에서 10, n = 10⁶에서 20으로 floor(log₂n)+1과 같았다. 값 [1,2,2,2,2,2,3]에서 2를 찾자 인덱스 3을 돌려줬다(이 구현에서의 결과이고 다른 구현은 다른 인덱스를 돌려줄 수 있다).
