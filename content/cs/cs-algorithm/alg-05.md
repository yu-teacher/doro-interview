---
slug: "alg-05"
topic: "cs-algorithm"
tier: BASIC
difficulty: 1
title: "안정 정렬(stable sort)이란 무엇이고 왜 필요한가요?"
keywords: ["같은 키의 상대 순서 보존", "다단계 정렬", "선택 정렬 교환 방식은 불안정", "위치를 키에 덧붙여 안정화"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://xlinux.nist.gov/dads/HTML/stable.html", "https://xlinux.nist.gov/dads/HTML/selectionSort.html", "https://docs.python.org/3/howto/sorting.html", "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/List.html"]
concepts: [complexity-sorting]
importance: 2
links: [{to: "alg-08", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
안정 정렬은 키가 같은 항목들의 입력 순서가 출력에서도 그대로 유지되는 정렬입니다. 예를 들어 나이순으로 정렬해도 나이가 같은 사람들끼리는 원래 순서가 남습니다. 이 성질이 있으면 정렬을 여러 번 겹쳐서 다단계 정렬을 만들 수 있어서, 부차 키로 먼저 정렬하고 주 키로 한 번 더 정렬하면 됩니다. 선택 정렬을 교환 방식으로 구현하면 불안정하고, 많은 알고리즘은 원래 위치를 키에 덧붙여 비교하면 안정한 변형이 됩니다. 자바 List.sort와 파이썬 정렬은 안정성이 문서로 보장됩니다.

(공식 문서) DADS stable 항목은 같은 키를 가진 항목의 입력상 상대 순서가 출력에서 항상 보존되는 알고리즘이라고 정의하고, 원래 위치를 키에 덧붙이면 많은 알고리즘을 안정 변형으로 만들 수 있다고 한다. selection sort 항목은 교환 방식 구현은 안정적이지 않다고 한다. Python Sorting HOW TO는 정렬이 안정적임을 보장하고 정렬을 여러 단계로 겹쳐 복합 정렬을 만들 수 있다고 한다. Java SE 25 List.sort는 "sort is stable"이라고 명시한다.
(실험 확인) 나이순 정렬에서 입력 (Max 45, Brodsky 19, David 21, Carla 45, Liang 19)을 교환 방식 선택 정렬로 정렬하면 45세 둘이 Carla, Max 순으로 뒤바뀌었고 Python `sorted`는 Max, Carla 순을 유지했다(Python 3.14.0). 힙 정렬(직접 구현)도 같은 키 (1,a), (1,b), (1,c)를 b, c, a 순으로 바꿔 놓았다.
