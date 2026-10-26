---
slug: "jvr-21"
topic: "java-versions"
tier: TRICKY
difficulty: 3
title: "JDK 20 이후 `3:30 PM` 같은 시간 문자열을 파싱하거나 비교하는 테스트가 깨지는 이유는 무엇인가요?"
keywords: ["CLDR 42의 좁은 줄바꿈 없는 공백", "PM 앞이 U+202F", "로케일 의존 포맷", "ISO 포맷이나 직접 정한 패턴", "parseLenient와 공백 문자 클래스"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://github.com/spring-projects/spring-framework/wiki/Date-and-Time-Formatting-with-JDK-20-and-higher", "https://docs.oracle.com/en/java/javase/25/migrate/migrating-jdk-8-later-jdk-releases.html", "https://docs.oracle.com/en/java/javase/25/migrate/removed-tools-and-components.html"]
concepts: [jdk-migration]
importance: 1
---
**모범 답변 (30~60초)**
JDK 20이 Unicode CLDR 42를 채택하면서, 미국 로케일 시간 표기에서 `PM` 앞의 공백이 일반 공백이 아니라 좁은 줄바꿈 없는 공백(NNBSP, U+202F)으로 바뀌었기 때문입니다. 눈에는 똑같아 보이지만 로케일에 의존하는 `ofLocalizedTime` 같은 포맷으로 만든 문자열을 일반 공백 문자열과 비교하거나 파싱하면 실패합니다. Spring 팀은 ISO 형식이나 직접 정한 패턴을 쓰라고 권고하고, 불가피하면 JDK 23부터 지원되는 `parseLenient()`를 쓰거나 정규식에서 `\p{Zs}`로 공백을 받는 방법을 안내합니다. 예전 로케일 데이터를 강제하던 COMPAT는 JDK 23에서 제거됐습니다.

(공식 문서) Spring Framework 위키는 JDK 20이 CLDR 42를 채택해 AM/PM 앞 공백이 NNBSP로 바뀌었고, 20~22에서는 `-Djava.locale.providers=COMPAT`로 옛 데이터를 쓸 수 있으나 23에서 제거되었다고 쓴다. 권고 사항으로 ISO 형식이나 직접 정한 패턴 사용, 테스트에서 `\p{Zs}` 정규식, `DateTimeFormatter`는 기본이 엄격하므로 `DateTimeFormatterBuilder`의 `parseLenient()`를 소개하고, 공백에 대한 관대한 파싱은 JDK 23에서 도입됐다고 쓴다(권고는 Spring 팀의 의견이다). Oracle 가이드도 JDK 23에서 레거시 로케일 데이터가 제거됐다고 한다.
(실험 확인) 21, 24, 25에서 `DateTimeFormatter.ofLocalizedTime(FormatStyle.SHORT)`(Locale.US)로 `15:30`을 포맷하면 코드 포인트에 `202F`가 있었고 `3:30 PM`을 일반 공백으로 파싱하면 `DateTimeParseException`이었다. 21에서 COMPAT를 주면 공백이 `0020`이었고 파싱이 성공했다(경고 출력). 25에서는 COMPAT가 무시됐다. `ofPattern("h:mm a")`는 일반 공백이었다. `parseLenient()` 빌더는 24·25에서 두 공백 모두 파싱했지만 21에서는 일반 공백 문자열이 `DateTimeParseException`이었다. Corretto 8.512, 11.0.33, 17.0.21에서는 같은 포맷의 공백이 `0020`(일반 공백)이고 `3:30 PM`을 일반 공백으로 파싱하면 성공해 `15:30`을 얻었으나, 21.0.13과 25.0.4.1에서는 `202F`이고 파싱이 `DateTimeParseException`이었다. JDK 20은 설치되어 있지 않아 20에서 바뀐다는 경계 자체는 직접 확인하지 못했다.
