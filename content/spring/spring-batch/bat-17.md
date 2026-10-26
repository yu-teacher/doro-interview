---
slug: "bat-17"
topic: "spring-batch"
tier: TRICKY
difficulty: 3
title: "청크 쓰기 중 예외가 나면 어떤 아이템이 문제인지 어떻게 찾아 스킵하나요?"
keywords: ["청크 전체를 한 번에 쓰므로 원인 아이템 불명", "롤백 후 스캔 모드", "한 건씩 별도 트랜잭션", "프로세서 재호출", "write마다 flush"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-batch/reference/step/chunk-oriented-processing/configuring-skip.html", "https://docs.spring.io/spring-batch/reference/readers-and-writers/database.html"]
concepts: [batch-job-metadata, tx-boundary]
importance: 1
links: [{to: "bat-10", kind: PREREQ}, {to: "bat-16", kind: PREREQ}]
---
**모범 답변 (30~60초)**
ItemWriter는 청크 전체를 한 번에 받기 때문에 쓰기가 실패하면 어느 아이템 때문인지 프레임워크가 알 수 없습니다. 그래서 스킵 가능한 예외로 쓰기가 실패하면 청크 트랜잭션을 롤백하고 스캔 모드로 들어가, 실패한 청크의 아이템을 한 건씩 별도 트랜잭션으로 다시 시도해 문제의 아이템만 스킵하고 나머지는 씁니다. 이때 프로세서도 기본적으로 아이템마다 다시 호출됩니다. 프로세서 결과를 재사용하는 processorNonTransactional()은 writer가 아이템을 바꾸는 경우에는 쓰면 안 됩니다. 문서는 버퍼링 writer는 write마다 flush해야 스킵이 정확하다고도 합니다.

(공식 문서) Configuring Skip Logic 페이지(현행 6.0판)는 쓰기 실패는 읽기·처리 실패와 달리 청크 전체를 받아서 원인 아이템을 알 수 없다고 하고, 스킵 가능한 예외로 쓰기가 실패하면 청크 트랜잭션을 롤백하고 스캔 모드로 들어가 실패한 청크의 아이템을 한 건씩 트랜잭션 하나로 재시도한다고 설명한다. 프로세서는 기본적으로 트랜잭션 대상이라 재시도되는 아이템마다 다시 호출되고, 롤백된 트랜잭션의 출력은 버려진다. 프로세서 비용이 크고 출력이 다시 써도 안전할 때만 processorNonTransactional()로 결과를 캐시할 수 있고, writer가 아이템을 변경하면 쓰지 말라고 한다. Database 페이지는 버퍼링된 쓰기에서는 flush 때에야 오류가 나서 원인 아이템을 알 수 없으므로 ItemWriter 구현은 write 호출마다 flush하라고 권한다.
(실험하지 않았다) 문서 근거로만 썼다. 이전 버전의 스캔 동작과 같은지는 확인하지 않았다.
