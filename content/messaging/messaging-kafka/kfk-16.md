---
slug: "kfk-16"
topic: "messaging-kafka"
tier: DEEP
difficulty: 2
title: "Spring Kafka에서 리스너가 예외를 던지면 어떻게 되고, `DefaultErrorHandler`의 재시도와 데드 레터 토픽은 어떻게 동작하나요?"
keywords: ["DefaultErrorHandler 기본 재시도", "FixedBackOff(0, 9)", "소진 후 복구기 호출", "DeadLetterPublishingRecoverer -dlt 토픽", "재시도 없이 복구되는 치명적 예외"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-kafka/reference/kafka/annotation-error-handling.html"]
concepts: [dlq-retry]
importance: 2
links: [{to: "rmq-19", kind: RELATED}]
---
**모범 답변 (30~60초)**
리스너 예외는 컨테이너의 에러 핸들러로 넘어가고, `DefaultErrorHandler`는 기본 설정인 `FixedBackOff(0L, 9)`로 대기 없이 최대 9번 재시도합니다. 실패한 레코드와 아직 처리하지 않은 레코드는 오프셋을 되돌려 다시 받아 전달하고, 재시도를 소진하면 기본 복구기는 로그만 남깁니다. 복구기로 `DeadLetterPublishingRecoverer`를 쓰면 원래 토픽 이름에 `-dlt`를 붙인 토픽의 같은 파티션으로 보내므로 DLT 파티션이 충분해야 합니다. 역직렬화·변환 오류처럼 다시 해도 소용없는 예외는 재시도 없이 첫 실패에서 바로 복구기로 갑니다. 대기 동안 스레드를 재우므로 지연이 길면 `max.poll.interval.ms`를 넘길 수 있습니다.

(공식 문서) Spring for Apache Kafka 레퍼런스(현행 4.1.2)의 Handling Exceptions 절은 `DefaultErrorHandler`가 기본 설정 `FixedBackOff(0L, 9)`로 재시도하며 재시도 소진 뒤 기본 복구기는 실패한 레코드를 로그로 남긴다고 한다. 레코드 리스너에서는 실패 지점부터 오프셋을 되돌려(seek) 남은 레코드가 다음 `poll`에서 다시 오고, 소진 시 복구 후 복구된 레코드의 오프셋을 커밋한다고 설명한다. `DeserializationException`, `MessageConversionException`, `ConversionException`, `MethodArgumentResolutionException`, `NoSuchMethodException`, `ClassCastException`은 기본적으로 치명적 예외라 재시도를 건너뛰고 첫 실패에 복구기가 호출된다고 한다.
(공식 문서) 같은 문서의 Publishing Dead-letter Records 절은 `DeadLetterPublishingRecoverer`가 `KafkaTemplate`을 필요로 하고 기본적으로 원 토픽 이름에 `-dlt`를 붙인 토픽과 원 레코드와 같은 파티션으로 보내며, 그래서 기본 해석기에서는 DLT의 파티션 수가 원 토픽 이상이어야 한다고 한다. Back Off Handlers 절은 기본 핸들러가 백오프 시간이 지날 때까지 스레드를 멈추며, 지연이 `max.poll.interval.ms`보다 길 때는 컨테이너를 일시 정지시키는 `ContainerPausingBackOffHandler`가 유용하다고 한다.
(공식 문서) 같은 문서는 `DefaultErrorHandler`가 이전의 기본 에러 핸들러들을 대체한다고 하고, 트랜잭션을 쓸 때는 기본으로 에러 핸들러가 설정되지 않아 예외가 트랜잭션을 롤백한다고 한다. 기본 재시도 소진 뒤 기본 복구기가 로그만 남기는 것도 같은 문서에 있다.
Spring Kafka 라이브러리를 쓸 수 없는 환경이라 리스너·재시도·트랜잭션 동작은 실험하지 않았고, 위 내용은 문서 서술에만 근거한다.
