---
slug: "cch-01"
topic: "db-cache"
tier: BASIC
difficulty: 1
title: "Redis가 빠른 이유는 무엇이고, 싱글 스레드라는 말은 정확히 무슨 뜻인가요?"
keywords: ["메모리 기반 데이터셋", "멀티플렉싱 단일 스레드", "상수 시간 명령", "느린 명령이 다른 클라이언트 지연", "파이프라이닝"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://redis.io/docs/latest/develop/get-started/faq/", "https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/latency/", "https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/benchmarks/", "https://redis.io/docs/latest/develop/using-commands/pipelining/"]
---
**모범 답변 (30~60초)**
Redis는 데이터셋을 메모리에 두는 인메모리 데이터베이스라서 읽기와 쓰기가 매우 빠릅니다. 명령 처리는 기본적으로 단일 스레드가 멀티플렉싱으로 여러 클라이언트의 요청을 차례로 처리하는데, GET이나 SET 같은 명령은 상수 시간이라 하나가 아주 짧게 끝나고 소켓 입출력에서 막히지 않도록 설계되어 있습니다. 다만 싱글 스레드는 요청을 처리하는 부분을 가리키고, 디스크 입출력처럼 느린 작업에는 백그라운드 스레드를 씁니다. 그래서 큰 집합의 교집합처럼 오래 걸리는 명령 하나가 다른 모든 클라이언트를 기다리게 만들 수 있고, 네트워크 왕복이 병목이면 파이프라이닝으로 줄입니다.

(공식 문서) FAQ는 Redis가 메모리에 데이터를 두면서 디스크에도 영속화하는 데이터베이스이고, 메모리 안의 복잡한 자료구조는 디스크보다 다루기 단순하다고 설명한다. 지연 진단 문서는 대부분 단일 스레드로 동작하는 설계이며 하나의 프로세스가 멀티플렉싱으로 모든 요청을 순차 처리하고, 2.4부터 느린 디스크 I/O는 백그라운드 스레드로 하지만 요청은 단일 스레드가 처리한다고 한다. 같은 문서는 GET·SET·LPUSH는 상수 시간이지만 SORT·LREM·SUNION 같은 다수 원소 명령은 오래 걸려 다른 클라이언트가 기다린다고 한다. 벤치마크 문서는 한 인스턴스가 여러 CPU 코어를 쓰도록 설계되지 않았다고 하고, 파이프라이닝 문서는 왕복 시간(RTT) 때문에 여러 명령을 응답 대기 없이 한꺼번에 보내는 기법을 설명한다.
(실험 확인) Redis 7.4.11 컨테이너에서 `INFO server`의 `io_threads_active`는 0이었다(기본 설정, I/O 스레드를 켜지 않은 상태). 처리량이나 지연 시간은 측정하지 않았다.
