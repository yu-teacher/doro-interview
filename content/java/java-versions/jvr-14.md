---
slug: "jvr-14"
topic: "java-versions"
tier: DEEP
difficulty: 2
title: "Applet, Security Manager, Nashorn, 파이널라이제이션은 각각 언제 폐기되고 제거됐나요?"
keywords: ["Applet 17 제거 예정·26 제거", "Security Manager 17 제거 예정·24 영구 비활성화", "Nashorn 11 제거 예정·15 제거", "파이널라이제이션 18 제거 예정", "try-with-resources와 Cleaner"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://openjdk.org/jeps/398", "https://openjdk.org/jeps/504", "https://openjdk.org/jeps/411", "https://openjdk.org/jeps/486", "https://openjdk.org/jeps/372", "https://openjdk.org/jeps/421", "https://docs.oracle.com/en/java/javase/25/migrate/removed-tools-and-components.html"]
concepts: [jdk-migration, jvm-execution]
importance: 1
links: [{to: "jv-16", kind: RELATED}]
---
**모범 답변 (30~60초)**
Applet API는 Java 9에 deprecated, 17에 제거 예정이 됐고 Java 26에서 제거됐습니다. Security Manager는 17에서 제거 예정이 된 뒤 24에서 JEP 486으로 영구 비활성화되어 켜는 것도 설치하는 것도 불가능합니다. Nashorn 자바스크립트 엔진은 11에서 제거 예정이 되어 15에서 제거됐습니다. 파이널라이제이션은 18에서 제거 예정이 됐고, 대신 try-with-resources나 Cleaner를 쓰라고 합니다. 모두 Java 8 시절 코드를 올릴 때 경고나 오류가 나기 쉬운 지점입니다.

(공식 문서) JEP 398은 Release 17에서 Applet API를 제거 예정으로 표시하고 JEP 289(Java 9)의 deprecated를 이었다고 쓰며, JEP 504는 Release 26에서 제거한다고 한다. JEP 411은 17, JEP 486은 24에서 Security Manager를 켜는 기능과 설치하는 기능을 없애되 API는 남긴다고 한다. JEP 372는 Nashorn 제거 Release 15이고 11에서 제거 예정이었다. JEP 421은 18에서 파이널라이제이션을 제거 예정으로 하고 try-with-resources와 Cleaner를 대안으로 든다.
(실험 확인) Corretto 25.0.3에서 `System.setSecurityManager(...)`는 `UnsupportedOperationException: Setting a Security Manager is not supported`였고 `-Djava.security.manager=allow`를 주면 VM 초기화가 `java.lang.Error`로 실패했다(24도 같았다). 21에서는 같은 옵션으로 경고만 나왔다. `java.applet.Applet`을 상속한 클래스는 25에서 `[removal]` 경고와 함께 컴파일됐고, `ScriptEngineManager().getEngineByName("nashorn")`은 `null`이었으며, `finalize()` 오버라이드도 `[removal]` 경고였다.
(실험 확인) 같은 코드를 Corretto 11.0.33, 17.0.21, 21.0.13, 25.0.4.1에서 `javac -Xlint:all`로 컴파일하면 `java.applet.Applet` 상속은 11에서 `[deprecation]`, 17부터 `[removal]` 경고였고, `finalize()` 오버라이드는 11·17에서 `[deprecation]`, 21·25에서 `[removal]` 경고였다. `System.setSecurityManager(new SecurityManager())`는 17.0.21에서 예외 없이 설치됐고(`terminally deprecated method` 경고 출력), 21.0.13에서는 기본으로 `UnsupportedOperationException: The Security Manager is deprecated and will be removed in a future release`, 25.0.4.1에서는 `Setting a Security Manager is not supported`였다. `getEngineByName("nashorn")`은 8.512와 11.0.33에서 엔진을 반환했고 11은 `Nashorn engine is planned to be removed` 경고를 냈으며 17.0.21·21·25에서는 `null`이었다. 26에서의 Applet 제거는 JDK 26이 없어 확인하지 못했다.
