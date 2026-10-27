---
slug: "jvr-01"
topic: "java-versions"
tier: BASIC
difficulty: 1
title: "자바는 몇 개월마다 새 버전이 나오고, LTS는 무엇이며 어느 버전이 LTS인가요?"
keywords: ["6개월 주기 기능 릴리스", "LTS는 공급사가 지정", "8·11·17·21·25", "비LTS는 다음 릴리스로 대체", "2년 주기 LTS"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://openjdk.org/jeps/322", "https://www.oracle.com/java/technologies/java-se-support-roadmap.html"]
concepts: [java-release-lts]
importance: 3
links: [{to: "jvr-06", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
Java 10부터 기능 릴리스가 6개월마다 나옵니다. 버전 번호도 이 주기에 맞춰 올라갑니다. LTS는 장기 지원 릴리스인데, 어떤 버전을 LTS로 할지는 JDK를 배포하는 공급사가 정합니다. Oracle 기준으로 Java 8, 11, 17, 21, 25가 LTS이고, 나머지 비LTS 릴리스는 다음 기능 릴리스가 나오면 대체된 것으로 취급합니다. Oracle은 앞으로 LTS를 2년마다 내겠다는 계획을 밝히고 있습니다. 그래서 운영 환경에서는 보통 LTS 버전을 고릅니다.

(공식 문서) JEP 322는 `$FEATURE`가 6개월마다 증가하고(2018년 3월 릴리스가 JDK 10, 9월 릴리스가 JDK 11), 구현체가 장기 지원 시리즈임을 표시하는 수단으로 선택 정보 `$OPT`가 `LTS`로 시작하게 한다(예: `11.0.2+13-LTS`)고 설명한다. 즉 LTS는 자바 언어 사양이 아니라 배포하는 쪽의 지원 정책 표시다. Oracle Java SE Support Roadmap은 Java SE 8, 11, 17, 21, 25가 LTS이고 향후 LTS를 2년마다 내려는 의도이며, 비LTS는 새 기능 릴리스가 나오면 대체된 것으로 본다고 쓰고, 일정은 변경될 수 있다고 표시한다.
(실험 확인) Corretto 25.0.3의 `java -version`은 `openjdk version "25.0.3" 2026-04-21 LTS`로 출력했고, `Runtime.version().optional()`은 `Optional[LTS]`, `feature()`는 25였다.
(실험 확인) Corretto 11.0.33, 17.0.21, 21.0.13, 25.0.4.1에서 `java -version` 첫 줄 끝에 `LTS`가 붙었고 `Runtime.version().optional()`은 모두 `Optional[LTS]`, `feature()`는 각각 11, 17, 21, 25였다. Corretto 8.512는 `openjdk version "1.8.0_512"`로 `LTS` 표기가 없었다(옛 버전 체계).
