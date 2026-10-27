---
slug: "jvr-06"
topic: "java-versions"
tier: BASIC
difficulty: 1
title: "Spring Framework와 Spring Boot는 최소 어느 JDK를 요구하고, 어떤 JDK를 권장하나요?"
keywords: ["Framework 6.2·7.x는 JDK 17 이상", "Boot 3.0부터 Java 17 필요", "5.3은 JDK 8~21", "LTS 17·21·25를 완전 지원", "javax에서 jakarta로"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://github.com/spring-projects/spring-framework/wiki/Spring-Framework-Versions", "https://docs.spring.io/spring-boot/system-requirements.html", "https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-3.0-Migration-Guide"]
concepts: [jdk-migration, java-release-lts]
importance: 2
links: [{to: "jvr-16", kind: FOLLOWUP}, {to: "boot-15", kind: RELATED}]
---
**모범 답변 (30~60초)**
Spring Framework 6.2와 7.x는 JDK 17 이상이 필요하고, 5.3은 JDK 8부터 21까지를 지원합니다. Spring Boot는 3.0부터 Java 17 이상이 필요해서 Java 8은 더 이상 지원되지 않습니다. Spring 팀은 JDK의 LTS인 17, 21, 25를 완전히 테스트하고 지원하며 중간 릴리스는 최선 지원이라고 하고, Framework 7.x에는 JDK 25 이상을 운영에 권장한다고 적어 두었습니다. 그래서 Java 8 프로젝트를 Boot 3로 올리려면 JDK부터 올려야 하고, 이때 `javax` 패키지가 `jakarta`로 바뀌는 점도 함께 확인해야 합니다.

(공식 문서) Spring Framework Versions 위키는 JDK 범위를 7.x는 17-25+, 6.2는 17-25, 5.3은 8-21로 적고, LTS 17·21·25를 완전히 테스트·지원하며 22~24 같은 중간 릴리스는 최선 지원, 7.x에는 JDK 25 이상을 권장한다고 쓴다. 같은 페이지는 Jakarta EE 범위를 5.3은 `javax`, 6.2와 7.x는 `jakarta` 네임스페이스로 적는다. Spring Boot 3.0 마이그레이션 가이드는 Java 17 이상이 필요하고 Java 8은 지원되지 않는다고 쓰며, Boot 시스템 요구사항 페이지(읽은 시점 4.1.2)는 최소 Java 17, Java 27까지 호환이라고 적는다. 이 값들은 버전에 따라 바뀌므로 읽은 시점 기준이다.
(실험 확인) 없음. Spring을 실제로 실행해 보지 않았고 문서 서술만 근거로 한다.
