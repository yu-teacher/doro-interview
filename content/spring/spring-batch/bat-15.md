---
slug: "bat-15"
topic: "spring-batch"
tier: DEEP
difficulty: 2
title: "ItemProcessor에서 null을 반환하는 것과 예외를 던지는 것은 어떻게 다른가요?"
keywords: ["null 반환은 필터링", "예외는 스킵 대상", "filterCount와 skipCount 구분", "프로세서는 멱등하게"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-batch/reference/processor.html", "https://docs.spring.io/spring-batch/reference/domain.html"]
concepts: [batch-job-metadata, null-handling]
importance: 1
links: [{to: "bat-04", kind: PREREQ}]
---
**모범 답변 (30~60초)**
ItemProcessor는 아이템 하나를 받아 변환하거나 업무 로직을 적용해 돌려주는 선택적 구성 요소입니다. null을 반환하면 그 아이템은 writer로 넘어가지 않는데 이것이 필터링입니다. 문서는 필터링을 잘못된 레코드가 아니라 쓰지 않을 레코드를 거르는 일이라며 스킵과 구분합니다. 반면 프로세서가 던진 예외는 스킵 설정이 있으면 스킵 대상이 됩니다. 건수도 StepExecution에 필터는 filterCount, 스킵은 processSkipCount로 따로 남습니다. 또 fault tolerant 스텝에서는 청크가 롤백되면 같은 아이템이 다시 처리될 수 있어서 프로세서를 멱등하게, 즉 입력 아이템을 바꾸지 않게 짜라고 문서가 권합니다.

(공식 문서) Item processing 페이지는 ItemProcessor가 선택 요소이고, 필터링은 스킵과 다른 동작이라며 스킵은 레코드가 잘못됐다는 뜻이고 필터링은 쓰지 않을 레코드라는 뜻이라고 설명한다. 필터하려면 null을 반환하고 프레임워크가 writer로 가는 목록에서 뺀다. 프로세서가 던진 예외는 스킵 처리로 이어진다고 한다. Fault Tolerance 절은 청크가 롤백되면 읽는 중 캐시된 아이템이 다시 처리될 수 있으니 skip이나 retry를 쓰는 스텝의 프로세서는 멱등해야 하고, 입력 아이템은 건드리지 않고 결과 인스턴스만 바꾸는 것이 전형적이라고 한다. Domain Language 페이지의 StepExecution 속성표에 filterCount와 processSkipCount가 따로 있다.
(실험하지 않았다) 문서 근거로만 썼다.
