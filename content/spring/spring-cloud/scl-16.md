---
slug: "scl-16"
topic: "spring-cloud"
tier: TRICKY
difficulty: 3
title: "Config Server의 설정을 바꿔 푸시했는데 실행 중인 서비스에 반영되지 않는 이유는 무엇이고, 어떻게 반영시키나요?"
keywords: ["클라이언트는 기본적으로 폴링하지 않음", "@RefreshScope와 /refresh", "@ConfigurationProperties 재바인딩", "Spring Cloud Bus로 전체 인스턴스에 전파", "생성자 바인딩·record는 갱신 불가"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-cloud-commons/reference/spring-cloud-commons/application-context-services.html", "https://docs.spring.io/spring-cloud-config/reference/server/push-notifications-and-bus.html"]
concepts: [externalized-config]
importance: 1
links: [{to: "scl-04", kind: PREREQ}, {to: "scl-17", kind: PREREQ}, {to: "k8s-20", kind: RELATED}, {to: "boot-09", kind: RELATED}]
---
**모범 답변 (30~60초)**
Config 클라이언트는 기본으로 변경을 폴링하지 않아서, 서버가 바뀌어도 이미 기동한 인스턴스는 모릅니다. 갱신하려면 `/refresh` 엔드포인트를 노출해 호출해야 하고, 그러면 `@RefreshScope` 빈은 캐시가 지워져 다음 호출 때 새 값으로 다시 만들어집니다. `@ConfigurationProperties` 빈은 `EnvironmentChangeEvent`가 발행될 때 다시 바인딩됩니다. 다만 생성자 바인딩이나 record를 쓴 `@ConfigurationProperties`는 갱신할 수 없고, 프로퍼티를 지운 뒤 갱신해도 값이 사라지지 않는다고 문서가 경고합니다. 인스턴스가 많으면 일일이 호출하지 않고 Git 웹훅과 `/monitor`, Spring Cloud Bus로 `RefreshRemoteApplicationEvent`를 전체에 전파합니다.

(공식 문서) Commons의 애플리케이션 컨텍스트 서비스 문서는 Config 클라이언트가 기본으로 환경 변경을 폴링하지 않고, 폴링 대신 스프링 클라우드 Bus로 `EnvironmentChangeEvent`를 모든 인스턴스에 브로드캐스트하라고 권한다고 쓴다. `EnvironmentChangeEvent`가 오면 `@ConfigurationProperties` 빈을 다시 바인딩하고 `logging.level.*` 로거 레벨을 설정한다. `@RefreshScope` 빈은 지연 프록시이고 스코프가 초기화된 값을 캐시하므로 캐시 항목을 무효화해야 다시 만들어진다. `/refresh` 엔드포인트는 `management.endpoints.web.exposure.include: refresh`로 노출해야 한다.
(공식 문서) 같은 문서는 생성자 바인딩을 쓰는 객체(자바 record 포함)에 붙인 `@ConfigurationProperties`는 갱신할 수 없다고 하고, 설정 값을 제거한 뒤 갱신해도 값의 존재 여부는 갱신되지 않아서 값이 있다는 전제 대신 없다는 전제로 로직을 짜거나 값이 바뀌는 쪽에 의존하라고 안내한다. `HikariDataSource`는 기본으로 갱신 대상에서 제외된다(`spring.cloud.refresh.never-refreshable`). 재바인딩 중에는 다른 스레드가 일시적으로 중간 상태를 볼 수 있어 일관된 값이 필요하면 `@RefreshScope`를 쓰라고 한다.
(공식 문서) Config 푸시 알림 문서는 `spring-cloud-config-monitor`와 Bus를 활성화하면 `/monitor` 엔드포인트가 켜져 깃 제공자의 웹훅을 받고, 서버가 변경됐을 만한 애플리케이션을 겨냥해 `RefreshRemoteApplicationEvent`를 보낸다고 한다. 이 이벤트는 Config Server와 클라이언트 양쪽에서 Bus가 활성화돼야 전달된다. 웹훅에는 제공자별 비밀을 검증하며, 비밀이 하나도 설정되지 않으면 `/monitor`가 모든 웹훅 요청을 거부한다. 실제 서버를 띄워 갱신을 실행하지는 않았다.
