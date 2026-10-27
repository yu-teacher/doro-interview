---
slug: "aws-14"
topic: "cloud-aws"
tier: TRICKY
difficulty: 3
title: "RDS 다중 AZ에서 장애 조치가 일어난 뒤에도 자바 애플리케이션이 계속 실패한다면 DNS와 관련해 무엇을 의심해야 하나요?"
keywords: ["장애 조치 시 DNS 레코드 변경", "기존 연결 재수립 필요", "JVM DNS 캐시 TTL", "TTL 60초 이하 권고", "networkaddress.cache.ttl 속성"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.Failover.html", "https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZSingleStandby.html"]
concepts: [high-availability]
importance: 1
links: [{to: "aws-13", kind: PREREQ}, {to: "net-13", kind: RELATED}]
---
**모범 답변 (30~60초)**
RDS는 장애 조치 때 DB 인스턴스의 DNS 레코드를 대기 인스턴스로 가리키도록 바꾸므로, 기존 연결은 새로 맺어야 합니다. 그런데 JVM은 한 번 해석한 IP를 TTL 동안 캐시하고, 일부 설정에서는 JVM을 재시작할 때까지 갱신하지 않기도 합니다. 그러면 DNS가 바뀌어도 애플리케이션이 옛 IP로 계속 접속을 시도합니다. 공식 문서는 AWS 리소스처럼 DNS 항목이 바뀔 수 있는 대상에 접속하는 JVM의 TTL을 60초 이하로 설정하라고 권고하고, `networkaddress.cache.ttl` 보안 속성으로 현재 값을 확인할 수 있다고 설명합니다. 그래서 장애 조치 후에도 실패가 이어지면 캐시된 DNS와 끊어진 연결을 재사용하는 커넥션 풀을 먼저 의심합니다.

(공식 문서) 장애 조치 페이지는 장애 조치 메커니즘이 DB 인스턴스의 DNS 레코드를 대기 인스턴스를 가리키도록 바꾸므로 기존 연결을 다시 맺어야 한다고 한다. 일반적인 장애 조치 시간은 60~120초이고 큰 트랜잭션 등으로 늘 수 있다. JVM이 IP를 TTL 동안 캐시하며 일부 구성에서는 기본 TTL이 재시작 전까지 갱신하지 않도록 돼 있을 수 있어 TTL을 60초 이하로 권고하고, 기본 TTL은 JVM 버전과 보안 관리자 설치 여부에 따라 다르며 60초 미만이면 설정을 무시해도 된다고 한다.
(실험 확인) JDK 25(Corretto 25.0.3)에서 `Security.getProperty("networkaddress.cache.ttl")`은 null이었다. 그 JDK의 `java.security` 파일에는 이 속성이 주석 처리돼 있고 기본 동작은 30초 캐시라는 설명이 있었다. 같은 JDK에서 `networkaddress.cache.ttl`을 읽는 코드를 직접 다시 실행해 null을 확인했고, 설정 파일은 `jre/lib/security`가 아니라 `conf/security/java.security`에 있었다(문서의 경로는 JDK 8 방식). 다른 JDK나 보안 관리자 환경에서의 값은 확인하지 않았다.
(보충) 커넥션 풀을 의심하라는 부분은 문서의 서술(기존 연결 재수립)에서 이끌어 낸 일반적 점검 요령이다. 실제 장애 조치는 계정이 없어 실행하지 않았다.
