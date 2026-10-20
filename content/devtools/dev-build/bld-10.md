---
slug: "bld-10"
topic: "dev-build"
tier: DEEP
difficulty: 2
title: "`java-library` 플러그인에서 `api`와 `implementation`은 어떻게 다른가요?"
keywords: ["소비자 컴파일 클래스패스에 노출", "공개 API에 나오는 타입은 api", "내부 구현은 implementation", "재컴파일 범위 축소"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.gradle.org/current/userguide/java_library_plugin.html", "https://docs.gradle.org/current/userguide/java_plugin.html"]
concepts: [dependency-management]
importance: 1
links: [{to: "bld-14", kind: FOLLOWUP}, {to: "bld-03", kind: PREREQ}]
---
**모범 답변 (30~60초)**
`api`로 선언한 의존성은 그 라이브러리를 쓰는 다른 모듈의 컴파일 클래스패스까지 전이되고, `implementation`은 내부 구현용이라 소비자의 컴파일 클래스패스에는 노출되지 않습니다. 단 실행 시점에는 둘 다 소비자의 런타임 클래스패스에 들어갑니다. 공개 메서드의 파라미터나 상위 클래스, 공개 필드 같은 모듈의 공개 인터페이스에 타입이 나오는 라이브러리만 `api`로 두고 나머지는 `implementation`을 우선하라고 문서가 권합니다. 이렇게 하면 소비자가 전이 의존성에 실수로 기대지 않고, 구현 의존성이 바뀌어도 재컴파일 범위가 줄어듭니다.

```text
// lib: api apilib, implementation impllib  /  app: implementation project(':lib')
app compileClasspath : apilib, (lib 클래스 디렉터리)
app runtimeClasspath : apilib, impllib, lib.jar, ro
```

(공식 문서) Java Library 플러그인 문서는 `api`가 소비자의 컴파일 클래스패스에 전이되고 `implementation`은 소비자 컴파일 클래스패스로 새지 않으며 런타임에는 노출된다고 설명한다. 얻는 이점으로 전이 의존성에 실수로 기대지 않는 것, 클래스패스가 줄어 컴파일이 빨라지는 것, 구현 의존성이 바뀔 때 재컴파일이 줄어드는 것을 든다. 공개 API 판단 기준은 상위 클래스·인터페이스, 공개 메서드 파라미터(제네릭 포함), 공개 필드, 공개 어노테이션 타입에 나오는 경우이며, 메서드 본문이나 private 멤버에만 쓰는 타입은 구현 의존성이다. `api` 구성은 `java` 플러그인이 아니라 `java-library` 플러그인이 추가한다.
(실험 확인) Gradle 9.5.1 멀티 프로젝트(lib는 `java-library`, app은 `implementation project(':lib')`)에서 app의 클래스패스를 출력하니 코드 주석과 같았다. 컴파일 클래스패스에는 lib가 `api`로 선언한 것만, 런타임 클래스패스에는 `implementation`·`runtimeOnly`까지 있었다.
