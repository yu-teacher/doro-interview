---
slug: "boot-10"
topic: "spring-boot"
tier: DEEP
difficulty: 2
title: "내장 톰캣과 실행 가능한 fat jar는 무엇인가요?"
keywords: ["내장 서버", "8080", "executable jar", "`java -jar`", "bootJar", "`server.port`"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-boot/reference/web/servlet.html", "https://docs.spring.io/spring-boot/specification/executable-jar/index.html", "https://docs.spring.io/spring-boot/specification/executable-jar/nested-jars.html", "https://docs.spring.io/spring-boot/specification/executable-jar/launching.html", "https://docs.spring.io/spring-boot/gradle-plugin/packaging.html", "https://docs.spring.io/spring-boot/how-to/webserver.html", "https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide"]
concepts: [build-tool]
importance: 2
links: [{to: "bld-15", kind: RELATED}, {to: "cic-13", kind: RELATED}]
---
**모범 답변 (30~60초)**
Boot는 서블릿 애플리케이션에 내장 Tomcat과 Jetty를 지원하고, 보통 starter를 추가하면 설정된 서버 인스턴스가 함께 들어옵니다. 기본 포트는 8080이고 `server.port`로 바꿉니다. 그래서 외부 톰캣에 WAR를 배포하지 않고, 빌드 플러그인이 애플리케이션과 의존 jar를 한 파일로 묶은 실행 가능 jar를 만들면 `java -jar`로 바로 실행합니다. Gradle에서는 `bootJar` 태스크가 만들고, jar 안에는 애플리케이션 클래스는 `BOOT-INF/classes`, 의존 jar는 `BOOT-INF/lib`에 중첩되어 있습니다.

```bash
./gradlew bootJar
java -jar build/libs/myapp-0.0.1-SNAPSHOT.jar
```

- 공식 문서: 서블릿 앱은 내장 Tomcat과 Jetty를 지원하고 대부분 해당 starter로 설정된 인스턴스를 얻으며, 기본 포트는 8080이다. 포트와 바인딩 주소는 `server.port`, `server.address`로 설정한다. Boot 4에서는 Undertow 지원이 제거됐다(마이그레이션 가이드: Servlet 6.1 비호환).
- 공식 문서: `spring-boot-loader` 모듈이 실행 가능 jar/war를 지원하고 Maven/Gradle 플러그인이 자동 생성한다. 구조는 `BOOT-INF/classes`(애플리케이션 클래스)와 `BOOT-INF/lib`(의존 jar)이고, 매니페스트의 `Main-Class`는 `JarLauncher`이며 실제 `main`이 있는 클래스는 `Start-Class`로 지정한다. Launcher가 중첩 jar에서 리소스를 읽도록 ClassLoader를 구성하고 `main()`을 호출한다.
- 공식 문서(Gradle 플러그인): 실행 가능 jar는 `bootJar` 태스크가 만들고 `assemble`/`build`가 이에 의존한다.
- 공식 문서(How-to): Jetty로 바꾸려면 Tomcat starter(`spring-boot-starter-tomcat`)를 제외하고 `spring-boot-starter-jetty`를 추가한다.
