---
slug: "jvr-07"
topic: "java-versions"
tier: BASIC
difficulty: 1
title: "`java Foo.java`처럼 소스 파일을 바로 실행하는 기능(Java 11)과 Java 25의 컴팩트 소스 파일은 무엇인가요?"
keywords: ["소스 파일을 컴파일 없이 실행", "JEP 330 Java 11", "클래스 선언 없이 main", "인스턴스 main 메서드", "JEP 512 Java 25 정식"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://openjdk.org/jeps/330", "https://openjdk.org/jeps/512"]
concepts: [modern-java]
importance: 1
---
**모범 답변 (30~60초)**
Java 11의 JEP 330은 `java` 런처가 소스 파일 하나를 별도 컴파일 단계 없이 바로 실행하게 해 줍니다. Java 25에서 정식이 된 컴팩트 소스 파일과 인스턴스 main 메서드(JEP 512)는 더 나아가서, 클래스 선언과 `public static void main(String[] args)` 없이 `void main()` 하나만으로 프로그램을 쓸 수 있게 합니다. 목적은 초보자가 큰 프로그램용 문법을 몰라도 첫 프로그램을 쓰게 하고, 필요해지면 일반 클래스 형태로 자연스럽게 키워 가게 하는 것입니다. 콘솔 입출력용 `IO` 클래스도 `java.lang`에 들어갔습니다.

```java
void main() { IO.println("hello"); }
```

(공식 문서) JEP 330은 java 런처가 단일 소스 파일 프로그램을 실행하게 하고 shebang 파일 사용까지 포함한다고 한다. JEP 512는 Java 21의 JEP 445 이후 여러 번의 프리뷰를 거쳐 25에서 정식이 되었고, 초보자가 큰 프로그램용 언어 기능 없이 시작하게 하는 것과 숙련자가 작은 프로그램을 간결하게 쓰는 것이 목표이며, `IO` 클래스가 `java.lang` 패키지에 있다고 한다.
(실험 확인) 위 한 줄짜리 `Q.java`는 `java Q.java`로 실행되어 `hello`를 출력했다(Corretto 25.0.3). `javac --release 25`로 컴파일하면 `final class Q`와 인스턴스 메서드 `void main()`이 만들어졌고, `--release 21`로는 `implicitly declared classes are not supported in -source 21` 오류였다.
(실험 확인) Corretto 8.512에서 `java Fo.java`는 `Error: Could not find or load main class Fo.java`였고, 11.0.33·17.0.21·21.0.13·25.0.4.1에서는 소스가 바로 실행됐다. 컴팩트 소스 파일 `void main() { ... }`은 17.0.21에서 `class, interface, enum, or record expected`, 21.0.13에서 `unnamed classes are a preview feature and are disabled by default`(21에서는 이 기능 이름이 unnamed classes) 오류였고, 21에서 `--enable-preview --source 21`을 주면 `System.out.println`을 쓴 버전은 실행됐다. 같은 21에서 `IO.println`은 `cannot find symbol`이었다. 25.0.4.1에서는 플래그 없이 `hello`가 출력됐다.
