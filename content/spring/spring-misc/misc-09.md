---
slug: "misc-09"
topic: "spring-misc"
tier: DEEP
difficulty: 2
title: "스프링에서 가상 스레드는 어떻게 쓰나요?"
keywords: ["JDK 21", "`spring.threads.virtual.enabled`", "VirtualThreadTaskExecutor", "pinning", "커넥션 풀이 새 병목"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
가상 스레드는 JDK 21에서 정식 도입된 경량 스레드로, 블로킹 I/O가 많은 서버에서 "요청당 스레드" 모델을 유지하면서 동시 처리량을 높여 줍니다. 스프링은 6.1부터 JDK 21과 가상 스레드 호환을 지원했고 `VirtualThreadTaskExecutor` 등을 추가했습니다. Boot에서는 `spring.threads.virtual.enabled=true` 한 줄로 켭니다. 다만 Java 21 이상이 필요하고 24 이상을 권장하며, `synchronized` 등으로 캐리어 스레드가 고정되는 pinning이 있으면 처리량이 오히려 줄 수 있습니다. 또 가상 스레드가 많아져도 Hikari 커넥션 풀은 그대로 10개라서, 병목이 DB 커넥션으로 옮겨 갈 수 있다는 점도 함께 고려해야 합니다.

- (실험 확인) `spring.threads.virtual.enabled=true`를 켜면 톰캣 요청 스레드가 가상 스레드(`tomcat-handler-N`)로 바뀌고, `applicationTaskExecutor`도 `SimpleAsyncTaskExecutor` 기반 가상 스레드로 바뀌었다. 끄면 요청은 `http-nio-auto-N-exec-M` 플랫폼 스레드에서 처리된다. 켜도 Hikari 풀 크기는 10 그대로여서 커넥션 풀이 새 병목이 된다. pinning은 실험하지 않았다. 확인 테스트: `experiment/misc/VirtualThreadModelTest`, `ThreadModelTest`, `HikariPoolExhaustionTest`.

```yaml
spring:
  threads:
    virtual:
      enabled: true
```

(공식) 6.1 릴리스 노트: 가상 스레드 호환, `VirtualThreadTaskExecutor`. Boot 레퍼런스: Java 21 이상 필요, 24 이상 강력 권장, pinning으로 처리량 저하 가능, 활성화 시 스레드 풀 설정은 효과 없음.
(보충) 커넥션 풀 병목에 대한 언급은 필자의 의견이다.
