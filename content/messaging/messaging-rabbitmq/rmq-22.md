---
slug: "rmq-22"
topic: "messaging-rabbitmq"
tier: TRICKY
difficulty: 3
title: "Spring AMQP에서 DB 트랜잭션과 메시지 송수신을 함께 롤백하려면 어떻게 하나요? (channelTransacted)"
keywords: ["channelTransacted", "외부 트랜잭션 매니저", "리스너 실패 시 메시지는 브로커로 반환", "커밋 실패도 AMQP 롤백", "best efforts 1 phase commit"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-amqp/reference/amqp/transactions.html", "https://docs.spring.io/spring-amqp/reference/amqp/template.html"]
concepts: [distributed-consistency, tx-boundary]
importance: 1
links: [{to: "tx-19", kind: RELATED}, {to: "dst-11", kind: RELATED}, {to: "kfk-22", kind: RELATED}]
---
**모범 답변 (30~60초)**
`RabbitTemplate`과 리스너 컨테이너에 `channelTransacted=true`를 주면 송수신이 트랜잭션 채널에서 이뤄지고 예외는 롤백을 뜻합니다. 이미 진행 중인 Spring 트랜잭션이 있으면 메시징의 커밋과 롤백은 그 트랜잭션이 끝날 때까지 미뤄집니다. 예를 들어 `@Transactional` 메서드에서 받은 메시지를 DB에서 처리하다 실패하면 받은 메시지는 브로커로 돌아가고 보내려던 메시지는 전송되지 않습니다. 리스너 쪽은 컨테이너에 `PlatformTransactionManager`를 주면 되고, DB 커밋이 실패해도 AMQP 트랜잭션이 롤백돼 메시지가 돌아옵니다. 문서가 'Best Efforts 1 Phase Commit'이라 부르는 방식으로, 두 자원을 함께 커밋하는 분산 트랜잭션은 아닙니다.

(공식 문서) Spring AMQP 트랜잭션 문서는 `channelTransacted`가 true이면 모든 송수신을 커밋 또는 롤백으로 끝내고 예외가 롤백을 뜻한다고 설명한다. 진행 중인 트랜잭션이 있으면 메시징 커밋·롤백은 현재 트랜잭션 끝까지 미뤄지고, `@Transactional` 예시에서 DB 처리 실패 시 받은 메시지는 브로커로 돌아가고 보낼 메시지는 전송되지 않는다고 한다. 컨테이너에 `PlatformTransactionManager`를 주면 커밋 실패(DB 제약 위반 등)에도 AMQP 트랜잭션이 롤백되고 메시지가 돌아오며 이를 'Best Efforts 1 Phase Commit'이라 부른다고 한다. `channelTransacted`가 false(기본)이면 외부 트랜잭션이 있어도 메시징은 자동 ack되어 업무 롤백과 상관없이 커밋된다고 한다.
(공식 문서) 템플릿 문서는 트랜잭션이 성능을 크게 떨어뜨린다고 경고한다(존재하지 않는 익스체인지 감지 맥락).
(보충) 'Best Efforts 1 Phase'가 분산 트랜잭션(2PC)이 아니라는 해석은 용어 풀이이며, 문서가 2PC와 직접 비교한 문장은 아니다.
(실험 확인) RabbitMQ 4.4.0 브로커 수준 AMQP 트랜잭션(`tx.select`)에서, 트랜잭션 채널로 발행한 메시지는 `tx.commit` 전에는 큐에 보이지 않았고(ready 0) `tx.rollback`으로 버려졌으며 commit 뒤 1건이 보였다. 트랜잭션 채널에서 받은 메시지를 ack한 뒤 `tx.rollback`하면 ack가 취소돼 메시지는 unacked 1로 남았고 자동으로 큐에 돌아가지는 않았다. 이 환경에서 100건을 하나씩 `tx.commit`하는 것과 건마다 발행 확인을 기다리는 것은 소요 시간이 비슷했고, 둘 다 확인 없이 몰아 보내기보다는 훨씬 느렸다. 절대 수치는 클라이언트 소켓 설정(Nagle 알고리즘)에 따라 수십 배 달라져 적지 않는다. Spring `PlatformTransactionManager` 연동과 'Best Efforts 1 Phase Commit'은 실행하지 못했다(Spring 라이브러리를 쓸 수 없는 환경, 문서 근거).
