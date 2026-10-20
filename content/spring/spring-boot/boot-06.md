---
slug: "boot-06"
topic: "spring-boot"
tier: BASIC
difficulty: 1
title: "starter와 의존성 관리(BOM)는 무엇인가요?"
keywords: ["starter", "spring-boot-dependencies", "BOM", "버전 일관성"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-boot/reference/using/build-systems.html", "https://docs.spring.io/spring-boot/reference/features/developing-auto-configuration.html", "https://docs.spring.io/spring-boot/gradle-plugin/managing-dependencies.html", "https://docs.spring.io/spring-boot/appendix/dependency-versions/properties.html"]
---
**모범 답변 (30~60초)**
starter는 특정 기능에 필요한 의존성 묶음을 한 번에 가져오는 의존성 디스크립터입니다. 공식 starter는 `spring-boot-starter-*` 이름을 쓰고, 예를 들어 `spring-boot-starter-data-jpa`를 추가하면 JPA 접근에 필요한 것들이 들어옵니다. 버전은 Boot 릴리스마다 큐레이션된 목록인 `spring-boot-dependencies` BOM이 관리해서 보통 버전을 적지 않고, Boot를 올리면 일관되게 같이 올라갑니다. 공식 문서는 기반 Spring Framework 버전을 직접 지정하지 말라고 권장합니다. 서드파티 starter는 `spring-boot`로 시작하면 안 되고 프로젝트 이름을 앞에 붙입니다.

```groovy
plugins { id 'io.spring.dependency-management' version '...' }
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'  // 버전 생략
}
ext['slf4j.version'] = '1.7.20'   // 관리되는 버전 오버라이드(문서 예시)
```

- 공식 문서(Build Systems): 각 릴리스는 지원하는 의존성의 큐레이션된 목록을 제공하며 버전을 적지 않아도 되고, Boot를 올리면 일관되게 함께 올라간다. 그래도 버전을 지정해 오버라이드할 수 있다. 목록은 Maven과 Gradle 모두에서 쓸 수 있는 표준 BOM(`spring-boot-dependencies`)이고, 기반 Spring Framework 버전은 지정하지 않기를 강하게 권장한다.
- 공식 문서: 공식 starter는 `spring-boot-starter-*` 규칙을 따르고, 서드파티 starter 이름은 `spring-boot`로 시작하면 안 되며(공식 아티팩트용으로 예약) 보통 `thirdpartyproject-spring-boot-starter`처럼 프로젝트 이름으로 시작한다.
- 공식 문서(Gradle 플러그인): `io.spring.dependency-management` 플러그인을 적용하면 `spring-boot-dependencies` BOM을 자동으로 import해 버전 생략이 가능하고, 관리되는 버전은 해당 프로퍼티(예: `slf4j.version`)를 `ext[...]`로 설정해 바꾼다. 프로퍼티 이름 목록은 레퍼런스의 Dependency Versions Properties 부록(예: `hibernate.version`)에 있다. 오버라이드는 호환성 문제를 일으킬 수 있어 신중해야 한다고 경고한다. 플러그인 대신 Gradle 네이티브 BOM 지원을 쓰면 빌드는 빠르지만 프로퍼티 기반 오버라이드는 플러그인 쪽의 장점으로 설명된다.
