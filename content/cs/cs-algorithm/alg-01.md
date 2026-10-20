---
slug: "alg-01"
topic: "cs-algorithm"
tier: BASIC
difficulty: 1
title: "빅오(Big-O) 표기는 무엇을 뜻하고, O와 Θ는 어떻게 다른가요?"
keywords: ["점근적 상한", "상수 c와 임계값 k", "Θ는 같은 차수", "계산 모델 명시"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://xlinux.nist.gov/dads/HTML/bigOnotation.html", "https://xlinux.nist.gov/dads/HTML/asymptoticTimeComplexity.html"]
---
**모범 답변 (30~60초)**
빅오는 입력 크기 n이 커질 때 알고리즘의 시간이나 메모리가 어떤 함수의 상수 배수 이하로 억제된다는 점근적 상한입니다. 정의는 양의 상수 c와 k가 있어서 n이 k 이상이면 f(n)이 c·g(n) 이하라는 것이라 계수와 낮은 차수 항은 버립니다. 상한이라서 3n+4도 엄밀히는 O(n²)이고, 같은 차수라는 의미는 Θ로 따로 씁니다. 또 무엇을 세는지(비교 횟수, 메모리, 메시지 수)에 따라 값이 달라지므로 계산 모델을 함께 밝혀야 합니다. n이 충분히 크면 상수 배수보다 증가 차수가 더 중요해집니다.

(공식 문서) NIST DADS의 big-O notation 항목은 f(n) = O(g(n))을 "양의 상수 c와 k가 있어 n ≥ k 에서 0 ≤ f(n) ≤ c·g(n)"으로 정의하고, c와 k는 n에 의존하면 안 된다고 한다. 3n+4가 엄밀히는 O(n²)이며 "같다"는 뜻은 Θ로 표현한다는 설명, 실행 시간 대신 비교·이동·디스크 접근·메모리 등 무엇을 셀지는 계산 모델에 달렸다는 설명도 같은 항목에 있다. asymptotic time complexity 항목은 n이 무한히 커질 때의 실행 시간 거동이라고 정의한다.
(실험 확인) n² + 3n + 4 < 2n²은 n = 0~4에서는 거짓이고 n = 5부터 9999까지는 모두 참이었다(문서는 충분조건으로 n > 10을 든다). n = 10⁶일 때 n·log₂n ≈ 2.0×10⁷, n² = 10¹²였다.
