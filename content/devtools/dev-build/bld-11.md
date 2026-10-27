---
slug: "bld-11"
topic: "dev-build"
tier: DEEP
difficulty: 2
title: "Maven의 compile, provided, runtime, test 스코프는 각각 어떤 클래스패스에 들어가나요?"
keywords: ["compile 기본 스코프", "provided는 런타임 제외", "runtime은 컴파일 제외", "test는 비전이적"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://maven.apache.org/guides/introduction/introduction-to-dependency-mechanism.html", "https://docs.gradle.org/current/userguide/java_library_plugin.html"]
concepts: [dependency-management]
importance: 2
links: [{to: "bld-05", kind: PREREQ}, {to: "bld-03", kind: RELATED}]
---
**모범 답변 (30~60초)**
스코프를 생략하면 `compile`이고, 모든 클래스패스에서 쓰이며 의존하는 프로젝트로 전이됩니다. `provided`는 JDK나 서블릿 컨테이너 같은 실행 환경이 제공한다고 기대하는 것으로, 컴파일과 테스트 클래스패스에는 있지만 런타임 클래스패스에는 없고 전이되지 않습니다. `runtime`은 컴파일에는 필요 없고 실행에만 필요한 것이며, `test`는 테스트 컴파일과 실행에만 쓰이고 전이되지 않습니다. Gradle에서 대응하는 구성은 대체로 `implementation`, `compileOnly`, `runtimeOnly`, `testImplementation`입니다.

(공식 문서) Maven 의존성 메커니즘 가이드는 스코프 여섯 가지(compile, provided, runtime, test, system, import)를 설명한다. compile은 기본이며 모든 클래스패스에 있고 전이된다. provided는 컴파일과 테스트 클래스패스에 있고 런타임에는 없으며 전이되지 않는다. runtime은 런타임과 테스트 클래스패스에 있고 컴파일에는 없다. test는 테스트 컴파일과 실행에만 있고 전이되지 않는다. 직접 선언한 의존성의 스코프와 전이 의존성의 스코프 조합표도 있어, 예를 들어 compile 의존성의 전이 provided는 빠진다. Gradle 문서는 POM이 있는 의존성에서 compile 스코프는 컴파일 클래스패스에, runtime 스코프는 런타임 클래스패스에만 더해진다고 한다.
(보충) 위의 Maven 스코프와 Gradle 구성의 대응 표는 두 문서의 설명을 맞춰 본 일반 정리이며 공식 대응표가 아니다. 특히 `provided`는 테스트 클래스패스에도 있는데 Gradle의 `compileOnly`는 그렇지 않으므로 완전히 같지 않다. Maven은 실험 환경에 없어 스코프 동작을 실행해 보지 않았다.
