---
slug: "bld-18"
topic: "dev-build"
tier: TRICKY
difficulty: 3
title: "스프링 부트가 관리하는 라이브러리 버전을 바꾸려고 `ext['slf4j.version']`을 설정했는데 적용되지 않습니다. 왜 그런가요?"
keywords: ["ext 속성은 dependency-management 플러그인 기능", "platform BOM은 속성 무시", "resolutionStrategy로 버전 지정", "관리 버전 변경은 호환성 위험"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-boot/gradle-plugin/managing-dependencies.html"]
---
**모범 답변 (30~60초)**
`ext['slf4j.version']` 같은 속성으로 관리 버전을 바꾸는 것은 `io.spring.dependency-management` 플러그인이 `spring-boot-dependencies` BOM의 속성을 읽어 쓰는 기능입니다. 그래서 Gradle 자체의 `platform`으로 BOM을 가져온 경우에는 이 속성이 적용되지 않고, 그때는 `resolutionStrategy.eachDependency` 같은 Gradle의 방식으로 버전을 지정해야 합니다. 어느 쪽이든 부트 릴리스는 정해진 서드파티 버전 조합으로 검증되므로, 버전을 덮어쓰면 호환성 문제가 생길 수 있어 신중해야 합니다.

```groovy
ext['slf4j.version'] = '2.0.17'
// dependency-management 플러그인 적용: slf4j-api 2.0.17 (selected by rule)
// platform(SpringBootPlugin.BOM_COORDINATES) 사용: slf4j-api 2.0.18 -> 속성 무시
```

(공식 문서) 스프링 부트 Gradle 플러그인 문서는 dependency-management 플러그인이 속성 기반으로 관리 버전을 바꿀 수 있게 해 주고(예를 들어 `slf4j.version`), Gradle BOM 지원을 쓰면 `spring-boot-dependencies`의 속성으로 버전을 제어할 수 없으므로 `resolutionStrategy` 같은 Gradle 방식을 써야 한다고 한다. 부트 릴리스는 특정 서드파티 조합에 맞춰 설계·테스트되어 덮어쓰기는 호환성 문제를 일으킬 수 있다고 경고한다.
(실험 확인) 스프링 부트 플러그인 4.1.0, Gradle 9.5.1, `spring-boot-starter-web`에서 BOM이 정한 `slf4j-api`는 2.0.18이었다. dependency-management 플러그인을 적용하고 `ext['slf4j.version'] = '2.0.17'`을 주면 2.0.17이 선택되었고(selected by rule), `platform(SpringBootPlugin.BOM_COORDINATES)`만 쓰고 같은 속성을 주면 2.0.18이 그대로였다.
