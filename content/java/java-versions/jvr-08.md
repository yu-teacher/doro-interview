---
slug: "jvr-08"
topic: "java-versions"
tier: DEEP
difficulty: 2
title: "프리뷰 기능과 인큐베이터 모듈은 무엇이고, 운영 코드에 써도 되나요?"
keywords: ["완성됐지만 영구적이지 않은 프리뷰", "--enable-preview", "클래스 파일 minor 65535", "인큐베이터 모듈", "다음 릴리스에서 바뀌거나 제거"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://openjdk.org/jeps/12", "https://openjdk.org/jeps/11", "https://openjdk.org/jeps/321", "https://openjdk.org/jeps/505"]
concepts: [java-release-lts, modern-java]
importance: 1
links: [{to: "jvr-12", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
프리뷰 기능은 완전히 명세되고 구현되어 있지만 영구적이지는 않은 기능으로, 개발자 피드백을 받으려고 정식 릴리스에 넣되 기본은 꺼 둔 것입니다. 컴파일과 실행에 모두 `--enable-preview`가 필요하고, 프리뷰를 쓴 클래스 파일에는 minor version 65535가 찍혀서 같은 릴리스의 JVM에서만 돌아갑니다. 인큐베이터 모듈은 아직 최종이 아닌 API나 도구를 `jdk.incubator` 계열 모듈로 배포하는 방식입니다. JEP 12가 프리뷰 기능을 쓴 코드는 새 릴리스에서 컴파일이나 실행이 안 될 수 있다고 밝히므로, 운영 코드에는 정식이 된 뒤 쓰는 것이 안전합니다.

(공식 문서) JEP 12는 프리뷰 기능을 완전히 명세·구현되었지만 영구적이지 않은 기능으로 정의하고, 옛 릴리스의 프리뷰 기능을 쓴 코드가 새 릴리스에서 반드시 컴파일·실행된다는 보장이 없고, 재프리뷰에는 새 JEP가 필요하다고 한다. JEP 11은 인큐베이터 모듈을 최종이 아닌 API·도구를 개발자에게 주고 정식화 또는 제거로 진행하는 수단이라고 하고, JEP 321은 JDK 9에서 인큐베이터였던 HTTP 클라이언트를 11에서 표준화한 예다. JEP 505는 구조적 동시성이 25에서 다섯 번째 프리뷰라고 한다.
(보충) 운영 코드에는 정식이 된 뒤 쓰라는 문장이 JEP에 있는 것은 아니며, 위 내용에서 끌어낸 일반적인 판단이다.
(실험 확인) JDK 25의 `javac --release 25`는 `StructuredTaskScope`를 쓰면 `is a preview API and is disabled by default` 오류를 냈다. `--enable-preview`를 주면 컴파일되고 `javap`로 minor version 65535, major 69였다. 플래그 없이 실행하면 `UnsupportedClassVersionError: Preview features are not enabled for P (class file version 69.65535)`였고 `--enable-preview`를 주면 42를 출력했다. `java --list-modules`에 `jdk.incubator.vector@25.0.3`이 있었다.
(실험 확인) Corretto 21.0.13에서 `--enable-preview --release 21`로 `int _ = 1;`(21의 프리뷰 기능)을 컴파일하자 클래스 파일이 minor 65535, major 65였다. 플래그 없이 21에서 실행하면 `UnsupportedClassVersionError: Preview features are not enabled for Prev (class file version 65.65535). Try running with '--enable-preview'`였고 `--enable-preview`를 주면 실행됐다. 같은 클래스를 25.0.4.1에서 `--enable-preview`로 실행하면 `was compiled with preview features that are unsupported. This version of the Java Runtime only recognizes preview features for class file version 69.65535`로 실패했다. 반대로 25에서 컴파일한 클래스(major 69)를 21에서 실행하면 `class file version 69.0 ... only recognizes class file versions up to 65.0` 오류였다. 25에서 `--enable-preview --release 25`로 `_`(25에서는 정식)만 쓴 코드를 컴파일하면 minor가 0이라 플래그 없이도 실행됐으므로, 프리뷰 표시는 프리뷰 기능을 실제로 쓸 때만 붙는다. `java --list-modules`의 인큐베이터 모듈은 17.0.21에서 `jdk.incubator.foreign`·`jdk.incubator.vector`, 21.0.13과 25.0.4.1에서 `jdk.incubator.vector`뿐이었다.
