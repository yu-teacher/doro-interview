---
slug: "dst-08"
topic: "design-distributed"
tier: BASIC
difficulty: 2
title: "서비스 디스커버리와 로드 밸런싱은 왜 필요하고, 클라이언트 측과 서버 측 방식은 어떻게 다른가요?"
keywords: ["동적으로 바뀌는 인스턴스 위치", "서비스 레지스트리", "클라이언트 측 디스커버리", "서버 측 라우터·로드 밸런서", "클라이언트가 레지스트리에 결합"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://microservices.io/patterns/client-side-discovery.html", "https://microservices.io/patterns/server-side-discovery.html", "https://learn.microsoft.com/en-us/azure/architecture/microservices/design/interservice-communication"]
concepts: [msa-boundary]
importance: 2
---
**모범 답변 (30~60초)**
컨테이너와 오토스케일링 환경에서는 서비스 인스턴스의 개수와 위치가 계속 바뀌어서 호출하는 쪽이 주소를 고정해 둘 수 없습니다. 그래서 인스턴스 위치를 알고 있는 서비스 레지스트리를 두고 찾아 씁니다. 클라이언트 측 디스커버리는 클라이언트가 레지스트리에 직접 물어 인스턴스 하나를 골라 호출합니다. 홉이 적지만 클라이언트가 레지스트리에 결합되고 언어마다 구현이 필요합니다. 서버 측 디스커버리는 클라이언트가 알려진 위치의 라우터(로드 밸런서)에 요청하면 라우터가 레지스트리를 보고 인스턴스로 전달합니다. 클라이언트는 단순해지지만 라우터라는 부품과 홉이 하나 늘어납니다. Kubernetes나 AWS ELB가 서버 측의 예입니다.

(원저자 자료) Richardson의 "Client-side service discovery"는 인스턴스 수와 위치가 동적으로 바뀐다는 상황을 전제하고, 클라이언트가 서비스 레지스트리를 조회해 인스턴스 위치를 얻는다고 설명한다. 장점은 서버 측 방식보다 부품과 네트워크 홉이 적다는 것이고, 단점은 클라이언트가 레지스트리에 결합되는 것과 사용하는 언어·프레임워크마다 디스커버리 로직을 구현해야 하는 것이다. "Server-side service discovery"는 클라이언트가 알려진 위치의 라우터(로드 밸런서)로 요청하고 라우터가 레지스트리를 조회해 전달한다고 설명한다. 장점은 클라이언트 코드 단순화와 클라우드의 기본 제공(예: AWS ELB)이고, 단점은 직접 설치 시 라우터를 별도로 복제해 운영해야 하는 것, 프로토콜 지원 필요, 홉 증가다. Kubernetes와 Marathon이 각 호스트에서 프록시를 돌려 서버 측 라우터 역할을 한다는 예도 든다.
(공식 문서) Azure "Interservice communication"은 Kubernetes에서 Service 리소스가 파드 묶음에 안정된 IP를 주고 기본으로는 임의의 파드가 선택되며, 서비스 메시는 관찰된 지연이나 미처리 요청 수 같은 지표에 기반해 더 지능적인 로드 밸런싱을 제공할 수 있다고 한다.
