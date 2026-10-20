---
slug: "bld-15"
topic: "dev-build"
tier: DEEP
difficulty: 2
title: "스프링 부트의 `bootJar`로 만든 jar(fat jar)와 일반 jar는 무엇이 다른가요?"
keywords: ["BOOT-INF/lib에 의존 jar 포함", "JarLauncher 실행", "plain 클래스파일 jar", "java -jar 단독 실행"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-boot/gradle-plugin/packaging.html", "https://docs.spring.io/spring-boot/gradle-plugin/reacting.html", "https://docs.spring.io/spring-boot/specification/executable-jar/launching.html"]
---
**모범 답변 (30~60초)**
`bootJar`는 애플리케이션 클래스뿐 아니라 의존성 jar들까지 한 파일에 담은 실행 가능한 jar입니다. 클래스는 `BOOT-INF/classes`에, 의존 jar는 `BOOT-INF/lib`에 들어가고, 그래서 `java -jar`로 바로 실행할 수 있고, 매니페스트의 `Main-Class`는 `JarLauncher`로, 내 main 클래스는 `Start-Class`로 지정됩니다. 반면 일반 `jar` task의 결과물은 내 클래스와 리소스만 담고 있어서 의존 jar를 따로 클래스패스에 줘야 합니다. 부트 플러그인은 두 파일이 겹치지 않도록 일반 jar에 기본으로 `plain` 분류자를 붙이고, `assemble`은 `bootJar`에 의존합니다.

```text
build/libs/exp4.jar        19.9MB   Main-Class: org.springframework.boot.loader.launch.JarLauncher
                                    Start-Class: demo.Main
  BOOT-INF/classes/demo/Main.class
  BOOT-INF/lib/ (jar 34개: spring-boot-4.1.0.jar, spring-web-7.0.8.jar ...)
build/libs/exp4-plain.jar  약 0.8KB  demo/Main.class 만 있음
```

(공식 문서) 스프링 부트 Gradle 플러그인 문서는 `bootJar`가 모든 의존성을 담아 `java -jar`로 실행할 수 있는 실행 가능 jar를 만들고, `assemble`이 `bootJar`에 의존하며, `jar` task는 `plain`을 분류자 기본값으로 써서 두 결과물이 함께 만들어진다고 한다. 클래스는 `BOOT-INF/classes`, jar는 `BOOT-INF/lib`에 들어가며 `developmentOnly` 구성의 의존성은 기본으로 빠진다고 설명한다. 실행 가능 jar 형식 문서는 `Main-Class`에 `JarLauncher` 같은 런처를, 실제 main 클래스는 `Start-Class`에 지정한다고 한다.
(실험 확인) 스프링 부트 플러그인 4.1.0, Gradle 9.5.1, JDK 25 임시 프로젝트(`spring-boot-starter-web` 의존, `main` 메서드만 있는 클래스 하나)에서 `build`를 실행했다. `java -jar build/libs/exp4.jar`는 정상 실행되었고, 매니페스트의 `Main-Class`가 `JarLauncher`, `Start-Class`가 내 클래스였다. `exp4-plain.jar`를 `java -jar`로 실행하면 기본 매니페스트 속성이 없다는 오류가 났고, `java -cp`로 클래스패스에 주면 실행되었다.
