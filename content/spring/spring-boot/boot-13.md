---
slug: "boot-13"
topic: "spring-boot"
tier: DEEP
difficulty: 2
title: "DevTools는 무엇을 하고, 왜 개발 전용인가요?"
keywords: ["developmentOnly", "자동 재시작", "두 개의 클래스로더", "프로퍼티 기본값", "패키징 시 비활성화"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
"DevTools는 개발 편의 기능 모음입니다. 템플릿 캐시를 끄는 등 개발에 맞는 프로퍼티 기본값을 적용하고, 클래스패스가 바뀌면 자동으로 재시작합니다. 재시작이 빠른 이유는 클래스로더를 둘로 나눠서, 서드파티 jar는 base 클래스로더에 두고 내가 개발하는 클래스만 restart 클래스로더에서 다시 로드하기 때문입니다. 운영에서는 캐시를 끄거나 스택 트레이스를 노출하는 설정이 위험하고 성능에도 불리해서 쓰면 안 됩니다. 그래서 Gradle에서는 `developmentOnly`로 선언하고, `java -jar`로 실행되는 패키징된 앱에서는 자동으로 비활성화됩니다."

- (실험 확인) DevTools는 `developmentOnly`라서 테스트 클래스패스에 `Restarter`가 없고, devtools 빈과 재시작 설정도 없다. 즉 테스트에서는 재시작이 활성화되지 않는다. 확인 테스트: `experiment/boot/EmbeddedServerAndLoggingExperimentTest`.

```groovy
// build.gradle (데모 프로젝트)
developmentOnly 'org.springframework.boot:spring-boot-devtools'
```

- 공식 문서: 기본값 예시로 `spring.web.resources.cache.period=0`, `spring.web.error.include-stacktrace=always` 등이 있고 `spring.devtools.add-properties=false`로 끌 수 있다. 완전히 패키징된 앱에서는 자동으로 비활성화되고 repackaged 아카이브에는 기본적으로 포함되지 않는다. `developmentOnly`는 패키징된 앱의 런타임 클래스패스와 다른 모듈로의 전이를 막는다.
- 공식 문서: LiveReload는 Boot 4.1.0부터 대체재 없이 deprecated 되었다. 4.1.1을 쓰는 데모에서는 이 기능에 의존하지 않는 편이 좋다.
