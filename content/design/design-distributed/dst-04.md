---
slug: "dst-04"
topic: "design-distributed"
tier: BASIC
difficulty: 1
title: "서비스 사이 통신에서 동기 호출과 비동기 메시징은 어떻게 고르나요?"
keywords: ["요청-응답 동기 호출", "결합도와 장애 격리", "동기 호출 연쇄의 가용성", "중복 메시지 처리", "비동기 I/O와 비동기 프로토콜의 구분"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://learn.microsoft.com/en-us/azure/architecture/microservices/design/interservice-communication", "https://microservices.io/patterns/communication-style/messaging.html", "https://microservices.io/patterns/communication-style/rpi.html", "https://martinfowler.com/articles/microservices.html"]
---
**모범 답변 (30~60초)**
동기 호출은 HTTP나 gRPC로 요청하고 응답을 기다리는 방식입니다. 단순하고 익숙하지만 호출 대상이 떠 있어야 하고, 호출이 여러 서비스로 이어지면 지연이 쌓이고, Fowler와 Lewis의 표현으로는 시스템 다운타임이 각 구성 요소 다운타임의 곱이 됩니다. 비동기 메시징은 보내는 쪽이 받는 쪽을 몰라도 되고 받는 쪽이 잠깐 죽어도 메시지가 남아 장애가 격리됩니다. 대신 브로커 운영, 지연, 중복 메시지 처리, 요청-응답 구현의 복잡도가 생깁니다. 그래서 응답이 바로 필요한 조회나 검증은 동기로, 상태 변화 알림과 긴 워크플로는 비동기로 섞어 쓰는 경우가 많습니다. HTTP는 클라이언트가 비동기 I/O를 써도 동기 프로토콜입니다.

(공식 문서) Azure "Interservice communication" 문서는 동기(호출자가 응답을 기다림)와 비동기 메시지 전달을 구분하고, 비동기 장점으로 결합도 감소, 다중 구독자, 장애 격리, 응답성, 부하 평준화, 워크플로를 든다. 단점으로 메시징 인프라와의 결합, 큐가 차면 늘어나는 지연, 비용, 복잡도(중복 메시지는 중복 제거나 멱등 처리 필요, 요청-응답 구현이 어려움)를 든다. 비동기 I/O는 호출 스레드가 막히지 않는 구현 세부사항이고 비동기 프로토콜은 보내는 쪽이 응답을 기다리지 않는 것이라서 HTTP는 동기 프로토콜이라고 구분한다. 문서의 예시도 하나의 시스템에서 수집부는 비동기, 스케줄러가 필요한 응답을 받는 부분은 동기로 섞는다.
(원저자 자료) Richardson의 microservices.io는 Messaging 패턴의 장점을 느슨한 런타임 결합과 브로커 버퍼링에 따른 가용성 향상으로, 단점을 가용성이 높아야 하는 브로커의 추가 복잡도와 요청/응답의 복잡함으로 정리한다. RPI(REST·gRPC)는 단순하고 브로커가 필요 없지만 클라이언트와 서비스가 상호작용 동안 모두 살아 있어야 해서 가용성이 줄어든다고 쓴다. Fowler·Lewis는 서비스 간 동기 호출이 이어지면 시스템의 다운타임이 구성 요소 다운타임의 곱이 된다고 경고한다.
