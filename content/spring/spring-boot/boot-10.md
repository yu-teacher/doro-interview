---
slug: "boot-10"
topic: "spring-boot"
tier: DEEP
difficulty: 2
title: "내장 톰캣과 실행 가능한 fat jar는 무엇인가요?"
keywords: ["내장 서버", "8080", "executable jar", "`java -jar`", "bootJar", "`server.port`"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
"Boot는 서블릿 앱에 내장 Tomcat이나 Jetty를 지원하고, 보통 starter를 추가하면 설정된 서버가 같이 들어옵니다. 기본 포트는 8080입니다. 그래서 외부 톰캣을 설치하고 WAR를 배포하는 대신, 빌드 플러그인이 애플리케이션과 의존 jar를 한 파일로 묶은 실행 가능 jar를 만들고 `java -jar`로 바로 실행합니다. 서버가 앱의 일부라서 배포 환경과 개발 환경이 같고, 컨테이너 이미지로 만들기도 쉽습니다."

```bash
./gradlew bootJar
java -jar build/libs/demo-0.0.1-SNAPSHOT.jar
```

- 공식 문서: 서블릿 앱은 내장 Tomcat/Jetty를 지원하며 기본 포트는 8080. 데모는 `server.port: 8080`을 명시한다.
- 공식 문서: `spring-boot-loader` 모듈이 실행 가능 jar/war를 지원하며 Maven/Gradle 플러그인이 자동 생성한다.
- (보충) 내부 구조(`BOOT-INF/classes`, `BOOT-INF/lib`, `JarLauncher`가 `Start-Class`의 `main` 호출)는 일반 지식이며 이번에 상세 페이지를 읽어 확인하지는 못했다. 태스크 이름 `bootJar`도 일반 지식이다.
- (보충) Jetty로 바꾸려면 Tomcat starter를 제외하고 Jetty starter를 추가한다.
