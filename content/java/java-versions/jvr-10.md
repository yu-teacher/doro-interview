---
slug: "jvr-10"
topic: "java-versions"
tier: DEEP
difficulty: 2
title: "Java 11에서 17로 올리면 무엇이 정식 기능이 되고, 무엇을 조심해야 하나요?"
keywords: ["switch 식 14·텍스트 블록 15", "record·instanceof 패턴 16", "sealed 17", "CMS·Nashorn 제거", "강한 캡슐화와 --illegal-access 무시"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://openjdk.org/jeps/361", "https://openjdk.org/jeps/378", "https://openjdk.org/jeps/395", "https://openjdk.org/jeps/394", "https://openjdk.org/jeps/409", "https://openjdk.org/jeps/363", "https://openjdk.org/jeps/372", "https://openjdk.org/jeps/377", "https://openjdk.org/jeps/379", "https://openjdk.org/jeps/403", "https://docs.oracle.com/en/java/javase/25/migrate/migrating-jdk-8-later-jdk-releases.html", "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/stream/Stream.html"]
concepts: [jdk-migration, modern-java, java-release-lts]
importance: 2
links: [{to: "jvr-11", kind: FOLLOWUP}, {to: "jo-06", kind: RELATED}, {to: "jo-11", kind: RELATED}, {to: "jo-12", kind: RELATED}]
---
**모범 답변 (30~60초)**
언어 쪽으로는 switch 식(14), 텍스트 블록(15), record와 instanceof 패턴 매칭(16), sealed 클래스(17)가 정식이 됩니다. API로는 `Stream.toList()`가 16에 들어왔습니다. 런타임 쪽으로는 CMS GC가 14에서, Nashorn이 15에서 제거되고 ZGC와 Shenandoah는 15에서 실험 기능을 벗습니다. 조심할 점은 17에서 JDK 내부 요소가 강하게 캡슐화되어 `--illegal-access` 옵션으로 완화할 수 없다는 것입니다. 내부 API를 반사로 쓰던 라이브러리는 업그레이드하거나 `--add-opens`로 열어 줘야 합니다.

(공식 문서) JEP 361은 Release 14, JEP 378은 15, JEP 394와 395는 16, JEP 409는 17이다. JEP 363은 CMS 제거가 14, JEP 372는 Nashorn 제거가 15, JEP 377과 379는 ZGC와 Shenandoah를 실험 기능에서 제품 기능으로 바꾸며 둘 다 15다. JEP 403은 `sun.misc.Unsafe` 같은 핵심 내부 API를 빼고 JDK 내부를 강하게 캡슐화하고 9~16에서 가능했던 단일 옵션 완화가 더는 안 된다고 하며, Oracle 가이드는 17에서 `--illegal-access` 사용이 경고만 내고 효과가 없다고 쓴다. `Stream.toList()`의 Javadoc Since는 16이다.
(실험 확인) JDK 25의 `javac --release`로 `record`, switch 식, 텍스트 블록, `instanceof` 패턴, `sealed`는 11에서 실패하고 17에서 성공했고, `Stream.toList()`는 15 실패, 16 성공이었다. `java --illegal-access=permit`는 `Ignoring option --illegal-access=permit; support was removed in 17.0` 경고를 냈다.
(실험 확인) Corretto 11.0.33에서는 `record`, switch 식, 텍스트 블록, `instanceof` 패턴, `sealed`, `Stream.toList()`가 모두 컴파일 실패(예: switch 식은 `illegal start of expression`, 텍스트 블록은 `unclosed string literal`)였고 17.0.21에서는 모두 컴파일·실행됐다. 리플렉션으로 `String`의 private 필드 `value`를 `setAccessible(true)`하면 11.0.33은 기본으로 `WARNING: An illegal reflective access operation has occurred` 경고만 내고 접근됐고, `--illegal-access=deny`를 주면 `InaccessibleObjectException`이었다. 17.0.21·21·25는 기본으로 `InaccessibleObjectException`이었고 `--illegal-access=deny`(및 `permit`)는 `support was removed in 17.0` 경고와 함께 무시됐으며 `--add-opens java.base/java.lang=ALL-UNNAMED`로 열면 접근됐다. CMS 옵션은 11.0.33이 deprecated 경고 후 기동했고 17.0.21은 `Unrecognized VM option`이었다. `getEngineByName("nashorn")`은 8.512와 11.0.33에서 엔진을 반환했고(11은 제거 예정 경고 출력) 17.0.21·21·25에서는 `null`이었다.
