---
slug: "bat-10"
topic: "spring-batch"
tier: DEEP
difficulty: 2
title: "faultTolerant 스텝에서 스킵(skip)은 어떻게 설정하고, 한도를 넘으면 어떻게 되나요?"
keywords: ["스킵 가능 예외와 한도", "SkipPolicy", "읽기·처리·쓰기 모두 대상", "한도 초과 시 스텝 실패", "데이터를 아는 사람의 판단"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-batch/reference/step/chunk-oriented-processing/configuring-skip.html", "https://docs.spring.io/spring-batch/reference/whatsnew.html"]
concepts: [resilience, batch-job-metadata]
importance: 2
links: [{to: "bat-04", kind: PREREQ}, {to: "bat-11", kind: FOLLOWUP}, {to: "bat-17", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
스킵은 지정한 예외가 나면 그 아이템만 건너뛰고 스텝을 계속하게 하는 기능입니다. 6.0에서는 faultTolerant()를 켠 뒤 SkipPolicy를 지정하는데, 문서 예제는 예외 계층과 한도를 함께 받는 LimitCheckingExceptionHierarchySkipPolicy를 씁니다. 지정한 예외는 읽기·처리·쓰기 어느 단계에서 나도 스킵 대상이고, 건수는 단계별로 따로 세지만 한도는 전체 합계에 적용됩니다. 한도가 10이면 열한 번째 스킵 시도에서 스텝이 실패합니다. 문서는 스킵해도 되는지는 데이터를 아는 사람이 정할 일이라고 합니다.

(공식 문서) Configuring Skip Logic 페이지는 스킵 한도 설정 예제(faultTolerant, skipPolicy)를 보이고, 선언한 예외가 읽기·처리·쓰기 중 어디서 나도 스킵 대상이며 단계별로 따로 집계하되 한도는 전체 스킵에 적용되고 열한 번째 스킵이 예외를 일으킨다고 한다. 스킵 여부는 데이터의 의미를 아는 사람이 정할 결정이며, 돈이 오가는 금융 데이터는 정확해야 해 스킵하기 어렵고 거래처 목록 적재 같은 경우는 허용될 수 있다고 예를 든다. What's new 페이지는 6.0에서 스킵이 SkipPolicy 인터페이스만을 기반으로 하도록 조정됐다고 한다. 같은 페이지에 XML의 skip-limit 설정 예제도 함께 실려 있다.
(실험하지 않았다) 문서 근거로만 썼다.
