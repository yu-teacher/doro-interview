---
slug: "bld-13"
topic: "dev-build"
tier: DEEP
difficulty: 2
title: "BOM(Bill of Materials)이란 무엇이고, 스프링 부트는 의존성 버전을 어떻게 관리하나요?"
keywords: ["버전을 모아 둔 BOM", "spring-boot-dependencies", "버전 생략 선언", "dependency-management 플러그인 또는 platform"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-boot/gradle-plugin/managing-dependencies.html", "https://docs.spring.io/spring-boot/gradle-plugin/reacting.html", "https://maven.apache.org/guides/introduction/introduction-to-dependency-mechanism.html", "https://docs.gradle.org/current/userguide/platforms.html"]
concepts: [dependency-management]
importance: 2
links: [{to: "bld-18", kind: FOLLOWUP}, {to: "bld-05", kind: PREREQ}, {to: "boot-06", kind: RELATED}]
---
**모범 답변 (30~60초)**
BOM은 관련된 여러 라이브러리의 버전을 한곳에 모아 둔 POM입니다. 스프링 부트는 `spring-boot-dependencies`라는 BOM으로 각 부트 릴리스에서 함께 검증한 서드파티 버전을 정해 두고, Gradle에서는 `io.spring.dependency-management` 플러그인을 적용하거나 Gradle 자체의 `platform` 기능으로 이 BOM을 가져옵니다. 그러면 `spring-boot-starter-web` 같은 의존성을 버전 없이 선언할 수 있습니다. Maven에서는 `dependencyManagement`에서 `import` 스코프로 BOM을 가져오는 방식이 같은 역할을 합니다.

```groovy
plugins {
  id 'java'
  id 'org.springframework.boot' version '4.1.0'
  id 'io.spring.dependency-management' version '1.1.7'
}
dependencies {
  implementation 'org.springframework.boot:spring-boot-starter-web'  // 버전 없음
}
```

(공식 문서) 스프링 부트 Gradle 플러그인 문서는 dependency-management 플러그인을 적용하면 부트 플러그인이 `spring-boot-dependencies` BOM을 자동으로 가져와 버전 없이 선언할 수 있다고 하고, Gradle 자체 BOM 지원(`platform`, `enforcedPlatform`)도 쓸 수 있다고 한다. 앞쪽은 속성 기반으로 버전을 바꿀 수 있고 뒤쪽은 빌드가 더 빠를 가능성이 크다고 한다. Maven 가이드는 BOM을 `dependencyManagement`에 `import` 스코프로 가져오는 패턴을 설명하고, Gradle `platform` 문서는 platform이 BOM을 소비할 수 있다고 한다.
(실험 확인) 스프링 부트 플러그인 4.1.0, dependency-management 1.1.7, Gradle 9.5.1에서 위 빌드는 버전 없는 선언이 해석되었다(오프라인 캐시 사용). 부트 플러그인만 적용하고 BOM을 가져오지 않은 빌드는 같은 선언이 해석에 실패했고, `platform(SpringBootPlugin.BOM_COORDINATES)`를 추가하면 해석되었다.
