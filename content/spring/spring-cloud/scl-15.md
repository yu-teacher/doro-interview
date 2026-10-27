---
slug: "scl-15"
topic: "spring-cloud"
tier: DEEP
difficulty: 2
title: "쿠버네티스에 배포할 때 스프링 클라우드의 어떤 부분은 플랫폼이 대신하고, 어떤 부분은 여전히 쓰나요?"
keywords: ["스프링 클라우드 쿠버네티스는 필수 아님", "쿠버네티스 네이티브 서비스 디스커버리", "ConfigMap·Secret 프로퍼티 소스", "리로드는 Configuration Watcher", "서비스 메시와 기능 중복"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-cloud-kubernetes/reference/index.html", "https://docs.spring.io/spring-cloud-kubernetes/reference/discovery-kubernetes-native.html", "https://docs.spring.io/spring-cloud-kubernetes/reference/discovery-client.html", "https://docs.spring.io/spring-cloud-kubernetes/reference/load-balancer.html", "https://docs.spring.io/spring-cloud-kubernetes/reference/kubernetes-awareness.html", "https://docs.spring.io/spring-cloud-kubernetes/reference/property-source-config.html", "https://docs.spring.io/spring-cloud-kubernetes/reference/property-source-config/propertysource-reload.html", "https://docs.spring.io/spring-cloud-kubernetes/reference/spring-cloud-kubernetes-configuration-watcher.html", "https://docs.spring.io/spring-boot/how-to/deployment/cloud.html", "https://docs.spring.io/spring-boot/reference/actuator/endpoints.html"]
concepts: [k8s-service-network, externalized-config, service-discovery]
importance: 2
links: [{to: "scl-04", kind: PREREQ}, {to: "scl-05", kind: PREREQ}, {to: "k8s-05", kind: RELATED}, {to: "k8s-06", kind: RELATED}]
---
**모범 답변 (30~60초)**
쿠버네티스는 서비스 이름 해석과 서버 측 서비스 디스커버리를 플랫폼이 하므로, 네이티브 방식에서는 호출하는 쪽이 클러스터 안에서 풀리는 서비스 이름만 알면 됩니다. 설정도 ConfigMap과 Secret으로 줄 수 있습니다. 스프링 클라우드 쿠버네티스는 이를 `DiscoveryClient`, 로드 밸런서, `spring.config.import=kubernetes:` 프로퍼티 소스로 연결하는 구현체인데, 공식 문서도 쿠버네티스 배포에 필수는 아니라고 밝힙니다. 설정 리로드 기능은 2020.0부터 deprecated라서 Configuration Watcher 컨트롤러를 대안으로 안내하고, 로드 밸런싱과 서킷 브레이커 같은 기능은 Istio 같은 서비스 메시가 맡을 수도 있습니다.

(공식 문서) Spring Cloud Kubernetes 문서는 이 프로젝트가 잘 알려진 스프링 클라우드 인터페이스의 구현을 제공해 쿠버네티스에서 스프링 클라우드 앱을 만들고 돌리게 하지만, 부트 앱을 쿠버네티스에 배포하는 데 필수는 아니라고 쓴다. 네이티브 서비스 디스커버리 문서는 쿠버네티스 자체가 서버 측 서비스 디스커버리를 할 수 있고 이를 쓰면 로드 밸런싱, 서킷 브레이커, 페일오버가 가능한 서비스 메시 Istio 같은 도구와 호환되며, 호출하는 쪽은 클러스터에서 풀리는 이름(FQDN)만 쓰면 된다고 한다. 디스커버리 클라이언트는 쿠버네티스 엔드포인트를 이름으로 조회하며, 로드 밸런서는 POD 모드(기본)와 SERVICE 모드로 동작한다.
(공식 문서) 프로퍼티 소스 문서는 `spring.config.import`에 `kubernetes:`를 지정해 ConfigMap과 Secret을 읽고 선언 순서대로 처리되며 나중 임포트가 우선한다고 한다. 리로드 문서는 이 기능이 2020.0에서 deprecated 됐고 Configuration Watcher 컨트롤러가 대안이라고 쓴다. Configuration Watcher 문서는 마운트된 ConfigMap이나 Secret이 바뀌어도 부트는 재시작 없이는 갱신하지 않으며, 스프링 클라우드의 `/refresh`나 Bus의 `RefreshRemoteApplicationEvent`로 갱신하는데 이 컨트롤러가 그 갱신을 트리거한다고 설명한다. 같은 프로젝트의 쿠버네티스 인식(awareness) 문서는 3.0.x부터 컨피그맵과 시크릿을 읽으려면 RBAC에 `list` 동사도 필요하다고 알린다.
(공식 문서) 스프링 부트의 배포 문서는 쿠버네티스에서 액추에이터가 HTTP 프로브(`/actuator/health/liveness`, `/actuator/health/readiness`)를 제공한다고 하고(엔드포인트 문서), 종료 때 트래픽이 이미 종료 중인 파드로 갈 수 있으니 `preStop` 핸들러에 sleep을 두라고 안내하며, 종료 유예 시간이 부족하면 `terminationGracePeriodSeconds`를 늘리라고 한다.
(보충) 쿠버네티스에서 Eureka 같은 별도 레지스트리가 꼭 필요하지 않다는 결론은 위 문서 서술에서 추론한 것이고, 게이트웨이나 Config Server를 쿠버네티스에서 계속 쓰는지는 문서가 정하지 않는 설계 선택이다. 쿠버네티스 클러스터가 없어 실험하지 못했다.
