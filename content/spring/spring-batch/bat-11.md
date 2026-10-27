---
slug: "bat-11"
topic: "spring-batch"
tier: DEEP
difficulty: 2
title: "재시도(retry)와 스킵은 어떻게 다르고, 어떤 예외에 재시도를 거나요?"
keywords: ["일시적 예외는 재시도", "결정적 예외는 스킵", "RetryPolicy 최대 재시도 횟수", "데드락 예외 예시", "Spring Framework 7 재시도 기반"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-batch/reference/step/chunk-oriented-processing/retry-logic.html", "https://docs.spring.io/spring-batch/reference/whatsnew.html"]
concepts: [batch-skip-retry, resilience]
importance: 1
links: [{to: "bat-10", kind: PREREQ}, {to: "dst-19", kind: RELATED}, {to: "dst-22", kind: RELATED}]
---
**모범 답변 (30~60초)**
같은 입력이면 항상 다시 실패하는 결정적 예외는 재시도해도 소용이 없으니 스킵하거나 스텝을 실패시키고, 락 경합으로 인한 데드락처럼 잠시 뒤 다시 하면 성공할 수 있는 일시적 예외에 재시도를 겁니다. 문서가 든 예가 파일 파싱 예외는 매번 같은 레코드에서 나서 재시도로 해결되지 않고, DeadlockLoserDataAccessException은 기다렸다 다시 하면 성공할 수 있다는 것입니다. 6.0에서는 faultTolerant 스텝에 RetryPolicy로 최대 재시도 횟수와 대상 예외를 지정하며, 재시도는 Spring Framework 7의 재시도 기능 위에서 동작합니다.

(공식 문서) Configuring Retry Logic 페이지는 대부분은 예외가 스킵이나 스텝 실패로 이어지길 원하지만 일부 예외는 결정적이지 않다고 하며, FlatFileParseException은 그 레코드에서 항상 나고 DeadlockLoserDataAccessException은 기다렸다 다시 하면 성공할 수 있다고 대비한다. 설정은 RetryPolicy.builder().maxRetries(...).includes(...)로 하는 예제가 있다. 읽기 예외를 재시도할 때는 리더가 성공적으로 아이템을 반환하기 직전까지 내부 위치를 옮기지 않아야 같은 아이템을 다시 읽으며, 결정적인 읽기 예외는 RetryPolicy가 아니라 SkipPolicy로 보내라고 한다. What's new 페이지는 재시도가 이전의 Spring Retry 라이브러리가 아니라 Spring Framework 7에 들어온 재시도 기능 기반으로 바뀌었다고 한다.
(실험하지 않았다) 문서 근거로만 썼다.
