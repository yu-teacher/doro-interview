---
slug: "jvr-12"
topic: "java-versions"
tier: DEEP
difficulty: 2
title: "Java 22~25에서 정식이 된 기능과 아직 프리뷰인 기능은 각각 무엇인가요?"
keywords: ["`_` 이름 없는 변수 22", "Stream Gatherers 24", "ScopedValue·컴팩트 소스 파일·모듈 import 25", "생성자 본문 유연화 25", "구조적 동시성은 프리뷰"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://openjdk.org/jeps/456", "https://openjdk.org/jeps/485", "https://openjdk.org/jeps/506", "https://openjdk.org/jeps/512", "https://openjdk.org/jeps/511", "https://openjdk.org/jeps/513", "https://openjdk.org/jeps/505", "https://openjdk.org/projects/jdk/26/", "https://openjdk.org/projects/jdk/27/"]
concepts: [modern-java, java-release-lts]
importance: 1
links: [{to: "jt-21", kind: RELATED}]
---
**모범 답변 (30~60초)**
22에서는 쓰지 않는 변수와 패턴을 `_`로 쓰는 이름 없는 변수가, 24에서는 Stream Gatherers가 정식이 됐습니다. 25에서는 `ScopedValue`, 컴팩트 소스 파일과 인스턴스 main, 모듈 import 선언, 그리고 `super(...)` 호출 앞에 문장을 쓸 수 있게 하는 생성자 본문 유연화(JEP 513)가 정식입니다. 반면 구조적 동시성 `StructuredTaskScope`는 25에서 JEP 505로 다섯 번째 프리뷰라서 `--enable-preview` 없이는 컴파일되지 않습니다. 이렇게 정식과 프리뷰를 구분해 두면 업그레이드 때 어디까지 써도 되는지 판단할 수 있습니다.

(공식 문서) JEP 456은 Release 22, JEP 485는 24(프리뷰였던 JEP 461·473을 거침), JEP 506·511·512·513은 모두 25로 Status가 Closed / Delivered다. JEP 505는 제목이 Structured Concurrency (Fifth Preview)이고 `This is a preview API`라고 쓴다. JDK 26·27 프로젝트 페이지는 구조적 동시성을 각각 JEP 525(여섯 번째 프리뷰)와 JEP 533(일곱 번째 프리뷰)로 나열하므로 25 이후에도 프리뷰가 이어진다.
(실험 확인) JDK 25의 `javac --release 25`는 `_` 변수, `Gatherers.windowFixed`, 컴팩트 소스 파일, `import module java.base;`, `ScopedValue.newInstance()`, `IO.println`, `super()` 앞 검증 코드를 모두 컴파일했다. `StructuredTaskScope`만 `is a preview API and is disabled by default` 오류였다. JDK 22~24는 설치되어 있지 않아 `--release 24`의 `ScopedValue`가 프리뷰 API 오류라는 것은 JDK 25 컴파일러의 `--release` 결과다. 실제 Corretto 21.0.13에서는 `_` 변수가 `unnamed variables are a preview feature and are disabled by default`, `ScopedValue`가 `ScopedValue is a preview API and is disabled by default`, 컴팩트 소스 파일이 `unnamed classes are a preview feature`, `StructuredTaskScope`가 프리뷰 API 오류였고, `Gatherers`는 `cannot find symbol`, `import module java.base;`는 `'.' expected`, `super(x)` 앞의 문장은 `call to super must be first statement in constructor`였다. Corretto 25.0.4.1에서는 `Gatherers.windowFixed`(`[[1, 2, 3], [4, 5, 6], [7]]`), `ScopedValue`(`v`), 컴팩트 소스 파일(`hello`), 모듈 import(`[1]`), 생성자 앞 검증(`ok`)이 컴파일·실행됐고 `StructuredTaskScope`만 프리뷰 오류였으며, `--enable-preview --source 25`로 실행하면 `42`를 출력했다.
