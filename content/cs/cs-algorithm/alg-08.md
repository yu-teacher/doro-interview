---
slug: "alg-08"
topic: "cs-algorithm"
tier: DEEP
difficulty: 2
title: "자바 Arrays.sort·Collections.sort와 파이썬 sort는 각각 어떤 알고리즘이고 안정성은 어떤가요?"
keywords: ["기본형은 듀얼 피벗 퀵 정렬", "객체는 안정적 적응형 병합 정렬", "Timsort 계열", "구현 노트는 사양이 아님"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/Arrays.html", "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/Collections.html", "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/List.html", "https://docs.python.org/3/howto/sorting.html", "https://docs.python.org/3/library/stdtypes.html", "https://github.com/python/cpython/blob/main/Objects/listsort.txt"]
---
**모범 답변 (30~60초)**
자바에서 int[] 같은 기본형 배열의 Arrays.sort는 듀얼 피벗 퀵 정렬이고, 객체 배열과 List.sort, Collections.sort는 Tim Peters의 파이썬 리스트 정렬에서 따온 안정적이고 적응형인 반복 병합 정렬입니다. 그래서 객체 정렬은 안정성이 문서로 보장되고, 거의 정렬된 입력이면 비교가 약 n번까지 줄지만 임시 공간을 최대 n/2 참조까지 씁니다. 파이썬의 sort와 sorted도 Timsort를 쓰고 안정성이 보장됩니다. 다만 알고리즘 이름은 구현 노트라 JDK나 CPython 버전에 따라 바뀔 수 있고 약속된 것은 안정성입니다.

(공식 문서) Java SE 25 Arrays 문서는 int[] 등의 sort를 Vladimir Yaroslavskiy, Jon Bentley, Joshua Bloch의 Dual-Pivot Quicksort라 하고(Implementation Note) 모든 데이터에서 O(n log n)을 제공한다고 쓴다. sort(Object[])는 stable이라 보장하고 구현 노트에서 stable, adaptive, iterative mergesort이며 거의 정렬된 입력이면 비교가 약 n번, 임시 저장은 무작위 입력에서 n/2 객체 참조까지라고 한다. 같은 문서 머리말은 이런 알고리즘 서술이 사양이 아닌 구현 노트이며 구현자가 다른 알고리즘으로 바꿀 수 있다고 하고, sort(Object[])는 병합 정렬일 필요는 없지만 stable이어야 한다고 쓴다. Collections.sort는 List.sort를 거치고 List.sort도 stable이라 명시한다. Python Sorting HOW TO는 정렬이 안정적임을 보장한다고 하고 Timsort를 언급한다. CPython의 listsort.txt는 적응형 안정 자연 병합 정렬(timsort)을 설명하고, 임시 배열이 N//2 포인터까지 필요할 수 있다고 하며, 2025년에 minrun 계산 방식이 바뀌었다는 서술도 있다.
(실험 확인) Corretto 25.0.3에서 Integer 10만 개를 Comparator로 정렬할 때 비교 횟수는 무작위 1,534,900(n·log₂n ≈ 1,660,964), 정렬 입력 99,999, 역순 입력 99,999였고, 키가 100종류인 객체 20만 개의 정렬 결과는 Arrays.sort(T[], Comparator)와 Collections.sort 모두 안정적이었다. Python 3.14.0 `sorted`도 같은 크기에서 1,531,798 / 99,999 / 99,999회였다.
(보충) 기본형 배열 정렬의 안정성은 기본형 값끼리는 구분할 수 없어 따지는 의미가 거의 없다는 일반 설명이다. listsort.txt는 main 브랜치 문서라 현재 릴리스 구현과 세부가 다를 수 있다.
