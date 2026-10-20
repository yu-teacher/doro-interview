---
slug: "boot-13"
topic: "spring-boot"
tier: DEEP
difficulty: 2
title: "DevTools는 무엇을 하고, 왜 개발 전용인가요?"
keywords: ["developmentOnly", "자동 재시작", "두 개의 클래스로더", "프로퍼티 기본값", "패키징 시 비활성화"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-boot/reference/using/devtools.html", "https://docs.spring.io/spring-boot/gradle-plugin/packaging.html", "https://docs.spring.io/spring-boot/gradle-plugin/reacting.html", "https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide"]
---
**모범 답변 (30~60초)**
DevTools는 개발 편의 기능 모음입니다. 캐시를 끄는 등 개발에 맞는 프로퍼티 기본값을 자동으로 적용하고, 클래스패스의 파일이 바뀌면 애플리케이션을 자동으로 재시작합니다. 재시작이 빠른 이유는 클래스로더를 둘로 나눠서, 서드파티 jar처럼 바뀌지 않는 클래스는 base 클래스로더에 두고 개발 중인 클래스만 restart 클래스로더에 로드해 재시작 때 그것만 버리기 때문입니다. 운영에서 실행하는 것은 보안 위험이라서 Gradle에서는 `developmentOnly`로 선언하고, `java -jar`로 실행되는 패키징된 앱에서는 자동으로 비활성화됩니다.

```groovy
// build.gradle
developmentOnly 'org.springframework.boot:spring-boot-devtools'
```

- 공식 문서: 캐싱은 운영에는 유익하지만 개발에서는 변경을 가려서, DevTools는 템플릿 캐시 등 캐시 옵션을 기본으로 끈다. 적용되는 프로퍼티 예시는 `spring.thymeleaf.cache=false`, `spring.web.resources.cache.period=0`, `spring.web.error.include-stacktrace=always` 등이고 `spring.devtools.add-properties=false`로 끌 수 있다.
- 공식 문서: 클래스패스의 파일이 바뀌면 자동 재시작하며, 재시작은 두 개의 클래스로더로 동작한다(바뀌지 않는 클래스는 base, 개발 중인 클래스는 restart 클래스로더). 그래서 재시작이 cold start보다 보통 훨씬 빠르다.
- 공식 문서: 완전히 패키징된 앱(`java -jar` 또는 특수 클래스로더로 시작)은 "production application"으로 보아 DevTools가 자동으로 비활성화된다. `-Dspring.devtools.restart.enabled=true`로 강제로 켤 수 있지만 운영에서는 보안 위험이라 하면 안 된다. repackaged 아카이브에는 기본으로 포함되지 않는다.
- 공식 문서: Gradle의 `developmentOnly`(Maven의 optional)는 DevTools가 이 프로젝트를 쓰는 다른 모듈로 전이되는 것을 막는다. Gradle 플러그인은 `developmentOnly`로 선언한 의존성을 실행 가능 jar/war에서 기본 제외한다.
- 공식 문서: LiveReload는 인기와 지원이 줄어 Spring Boot 4.1.0부터 대체재 없이 deprecated 되었고, Boot 4.0 마이그레이션 가이드에 따르면 4.0부터 기본으로 비활성화되어 `spring.devtools.livereload.enabled=true`로 켠다.
- (실험 확인) Gradle `developmentOnly`로 선언한 DevTools는 테스트 런타임 클래스패스에 `Restarter` 클래스가 없었고 devtools 빈도 없어서, 테스트 컨텍스트에서는 재시작이 활성화되지 않았다.
