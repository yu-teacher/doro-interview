---
slug: "jvr-22"
topic: "java-versions"
tier: TRICKY
difficulty: 2
title: "`_`를 변수 이름으로 쓰던 코드는 Java 8, 9, 21, 22에서 각각 어떻게 되나요?"
keywords: ["Java 8은 경고", "Java 9부터 키워드라 오류", "Java 22에서 이름 없는 변수", "catch·for·람다·패턴에서 사용", "값을 읽을 수는 없음"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://openjdk.org/jeps/456", "https://docs.oracle.com/en/java/javase/25/migrate/preparing-migration.html"]
concepts: [modern-java]
importance: 1
links: [{to: "jvr-12", kind: PREREQ}]
---
**모범 답변 (30~60초)**
Java 8에서는 `_`를 식별자로 쓰면 컴파일은 되지만 경고가 나고, Java 9부터는 키워드가 되어 식별자로 쓰면 컴파일 오류입니다. 그러다 Java 22의 JEP 456에서 `_`가 '쓰지 않는 변수와 패턴'을 뜻하는 이름 없는 변수로 정식 도입되었습니다. `catch (NumberFormatException _)`, `for (int _ : arr)`, 람다 `(a, _) -> ...`, 레코드 패턴 `Point(int x, _)`처럼 선언은 필요하지만 쓰지 않는 자리에서 의도를 드러냅니다. 다만 이 변수는 값을 읽을 수 없습니다. 21에서는 프리뷰라서 `--enable-preview`가 없으면 오류입니다.

(공식 문서) JEP 456은 Java 8부터 `_`를 식별자로 쓰면 경고하다가 이후 제거했고 22에서 이름 없는 변수·패턴으로 되살렸다고 하며, JDK 21의 JEP 443 프리뷰를 거쳐 Release 22에서 확정했다고 쓴다. 필드나 메서드 매개변수는 대상이 아니다(Non-Goal). Oracle 마이그레이션 가이드는 `_`를 한 글자 식별자로 쓰면 JDK 8에서 경고, 9부터 오류라고 쓴다.
(실험 확인) `int _ = 1;`을 Corretto 8.512의 `javac`로 컴파일하면 `warning: '_' used as an identifier`(`might not be supported in releases after Java SE 8`)만 나오고 컴파일·실행됐다. Corretto 11.0.33과 17.0.21은 `as of release 9, '_' is a keyword, and may not be used as an identifier` 오류, 21.0.13은 `unnamed variables are a preview feature and are disabled by default` 오류, 25.0.4.1은 성공이었다. 9와 10은 해당 JDK가 없어 JDK 25의 `--release 9`, `--release 10`이 `unnamed variables are not supported in -source N` 오류인 것만 확인했다(실제 9·10 컴파일러의 문구는 확인하지 못했다). 25에서 `for (int _ : ...)`, `catch (NumberFormatException _)`, `(a, _) -> a * 2`, `o instanceof Point(int x, _)`, `case A _ ->`, `var _ = ...`, `computeIfAbsent("k", _ -> 1)`이 모두 컴파일·실행됐고, `int _ = 1; println(_)`처럼 읽으면 `underscore not allowed here` 오류였다.
