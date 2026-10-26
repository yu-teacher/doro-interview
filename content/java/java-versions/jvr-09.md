---
slug: "jvr-09"
topic: "java-versions"
tier: DEEP
difficulty: 2
title: "Java 11에서 JAXB·JAX-WS 같은 Java EE 모듈이 JDK에서 빠졌는데, Java 8에서 올릴 때 어떻게 대응하나요?"
keywords: ["JEP 320으로 Java 11에서 제거", "JAXB·JAX-WS·CORBA·JTA 모듈", "컴파일·실행 실패", "독립 라이브러리를 의존성으로 추가", "Java 9에서 deprecated"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://openjdk.org/jeps/320", "https://docs.oracle.com/en/java/javase/25/migrate/removed-tools-and-components.html"]
concepts: [jdk-migration, dependency-management]
importance: 2
links: [{to: "jvr-16", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
Java 9에서 deprecated 된 Java EE와 CORBA 모듈이 Java 11의 JEP 320으로 JDK에서 제거됐습니다. JAXB(`java.xml.bind`), JAX-WS, JAF, 공통 애노테이션, CORBA, JTA 같은 모듈입니다. 그래서 Java 8에서는 의존성 없이 쓰던 `javax.xml.bind.JAXBContext` 같은 클래스가 11 이상에서는 컴파일도 실행도 되지 않습니다. 대응은 이 기술들의 독립 버전을 Maven Central 같은 곳에서 받아 의존성으로 추가하는 것입니다. JEP도 독립 버전을 쉽게 구할 수 있다는 점을 제거 이유로 듭니다.

(공식 문서) JEP 320은 `java.xml.ws`, `java.xml.bind`, `java.activation`, `java.xml.ws.annotation`, `java.corba`, `java.transaction`과 이를 묶은 `java.se.ee`를 제거 대상으로 나열하고, 독립 버전이 Maven Central 같은 곳에서 구해지므로 JDK에 둘 필요가 없다고 쓴다. 또 `idlj`, `orbd` 같은 CORBA 도구도 사라진다고 한다. 제거되는 JTA는 CORBA 연동용 `javax.transaction` 부분이고, JDBC용 `javax.transaction.xa`는 `java.sql`에 남는다고 설명한다. Oracle 마이그레이션 가이드의 Removed Tools and Components 페이지도 JDK 11에서 이 모듈들이 제거되었고, 이 API를 참조하는 기존 코드는 빌드를 바꾸지 않으면 컴파일되지 않으며 클래스패스의 코드는 `NoClassDefFoundError`나 `ClassNotFoundException`으로 실패한다고 쓰고, JAXB와 JAX-WS는 Maven에서 내려받을 수 있다고 안내한다.
(실험 확인) `javax.xml.bind.JAXBContext.class`를 참조하는 코드는 Corretto 8.512에서 컴파일·실행됐고, 11.0.33·17.0.21·21.0.13·25.0.4.1에서는 컴파일이 `package javax.xml.bind does not exist` 오류였다. 8.512에서 컴파일한 클래스를 11.0.33과 17.0.21에서 실행하면 `NoClassDefFoundError: javax/xml/bind/JAXBContext`(원인 `ClassNotFoundException`)였다.
