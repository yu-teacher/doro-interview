---
slug: "scl-18"
topic: "spring-cloud"
tier: TRICKY
difficulty: 3
title: "Eureka에 등록된 서비스의 앱 상태가 비정상이어도 Eureka에는 계속 UP으로 보일 수 있나요?"
keywords: ["기본은 항상 UP 보고", "eureka.client.healthcheck.enabled", "하트비트만으로 생존 판단", "기본 30초 갱신 주기", "application.yml에만 설정"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-cloud-netflix/reference/spring-cloud-netflix.html"]
concepts: [service-discovery, observability]
importance: 1
links: [{to: "scl-05", kind: PREREQ}, {to: "cic-15", kind: RELATED}, {to: "k8s-10", kind: RELATED}]
---
**모범 답변 (30~60초)**
네, 기본 설정에서는 그럴 수 있습니다. 디스커버리 클라이언트는 별다른 설정이 없으면 액추에이터의 헬스 상태를 Eureka에 전달하지 않아서, 등록에 성공한 뒤에는 앱이 비정상이어도 Eureka는 항상 UP이라고 알립니다. 인스턴스는 기본 30초 주기로 하트비트를 보내고 이 하트비트가 끊겨야 레지스트리에서 빠지므로, 프로세스는 살아 있지만 DB 연결이 죽은 상태 같은 경우는 걸러지지 않습니다. `eureka.client.healthcheck.enabled=true`를 켜면 앱 상태가 Eureka로 전파되는데, 이 값은 `application.yml`에만 두라고 합니다. `bootstrap.yml`에 두면 UNKNOWN 상태로 등록되는 부작용이 있습니다.

(공식 문서) Spring Cloud Netflix 문서의 Eureka 헬스 체크 절은 별도 지정이 없으면 디스커버리 클라이언트가 액추에이터가 알려 주는 현재 헬스 체크 상태를 전파하지 않아서, 등록에 성공한 뒤 Eureka는 항상 애플리케이션이 `UP` 상태라고 알린다고 쓴다. 이는 헬스 체크를 켜면 바뀌며, `eureka.client.healthcheck.enabled=true`는 `application.yml`에만 설정해야 하고 `bootstrap.yml`에 두면 UNKNOWN 상태로 Eureka에 등록되는 등 원치 않는 부작용이 있다고 한다. 더 세밀한 제어가 필요하면 `HealthCheckHandler`를 직접 구현하라고 한다.
(공식 문서) 같은 문서의 등록 절은 인스턴스마다 하트비트를 받고 설정된 시간표 안에 실패하면 보통 레지스트리에서 제거된다고 하고, 하트비트 기본 주기는 30초이며 인스턴스와 서버, 클라이언트의 로컬 캐시가 같은 메타데이터를 갖기까지 하트비트 3번 정도가 걸려 등록이 느려 보일 수 있다고 설명한다. 이 주기를 줄이는 것은 서버 계산이 갱신 주기를 가정하므로 운영에서는 기본을 유지하라고 한다. 서버를 띄워 동작을 실험하지는 않았다.
