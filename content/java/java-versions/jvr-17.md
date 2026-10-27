---
slug: "jvr-17"
topic: "java-versions"
tier: TRICKY
difficulty: 3
title: "`javac -source 8 -target 8`로 컴파일하면 왜 위험하고, `--release 8`은 무엇이 다른가요?"
keywords: ["source/target은 API를 제한하지 않음", "컴파일러 JDK의 라이브러리를 사용", "--release는 해당 버전 API 기준", "클래스 파일 버전 52", "둘을 함께 쓸 수 없음"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.oracle.com/en/java/javase/25/docs/specs/man/javac.html", "https://docs.oracle.com/en/java/javase/25/migrate/preparing-migration.html"]
concepts: [jdk-migration, build-tool]
importance: 1
links: [{to: "jvr-16", kind: PREREQ}]
---
**모범 답변 (30~60초)**
`-source`와 `-target`은 문법 수준과 클래스 파일 버전만 맞춰 줄 뿐, 컴파일할 때 참조하는 클래스 라이브러리는 컴파일러를 실행한 JDK의 것을 그대로 씁니다. 그래서 JDK 25로 `-source 8 -target 8`을 주고 `List.of` 같은 Java 9 이후 API를 써도 컴파일이 통과하고 클래스 파일 버전은 52로 나옵니다. 하지만 그 파일은 Java 8에서 돌지 않을 수 있습니다. `--release 8`은 Java 8의 API 정의를 기준으로 컴파일해서 `List.of`는 `cannot find symbol` 컴파일 오류가 납니다. 그래서 Oracle 가이드도 `--release`를 권하고, 둘을 함께 쓸 수는 없습니다.

(공식 문서) `javac` 문서는 `--release`가 해당 릴리스의 Java SE·JDK API 기준으로 컴파일하고 `--source`/`--target`과 함께 쓸 수 없다고 하며, `--source`는 언어 규칙만 지정한다. Oracle 마이그레이션 가이드는 JDK 11 이후 컴파일러에서는 `-source`/`-target` 대신 `--release`를 쓰라고 하고, 예시 경고로 부트스트랩 클래스 경로를 지정하지 않으면 JDK 8에서 실행되지 않는 클래스 파일이 생길 수 있으며 `--release`는 이를 자동으로 설정한다고 적는다. 라이브러리 기준이 컴파일러 JDK라는 표현은 이 경고와 아래 실험에서 읽어 낸 것이다.
(실험 확인) JDK 25에서 `System.out.println(java.util.List.of(1,2))`를 `-source 8 -target 8`로 컴파일하면 `bootstrap class path is not set in conjunction with -source 8`, `--release 8 is recommended instead` 경고와 함께 성공했고 `javap`의 `major version`은 52였다. `--release 8`은 `symbol: method of(int,int) location: interface List` 오류였다. 이어서 이 클래스 파일을 Corretto 8.512에서 실행하면 `java.lang.NoSuchMethodError: java.util.List.of(Ljava/lang/Object;Ljava/lang/Object;)Ljava/util/List;`로 실패했다. Corretto 11.0.33의 `javac -source 8 -target 8`도 `bootstrap class path not set in conjunction with -source 8` 경고와 함께 컴파일됐고 같은 8.512에서 같은 `NoSuchMethodError`였다.
