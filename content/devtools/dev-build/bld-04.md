---
slug: "bld-04"
topic: "dev-build"
tier: BASIC
difficulty: 1
title: "Gradle Wrapper(`gradlew`)는 왜 쓰고, 어떻게 만드나요?"
keywords: ["프로젝트가 정한 Gradle 버전", "gradlew 스크립트", "wrapper 파일을 버전 관리에 포함", "IDE·CI 환경 통일"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.gradle.org/current/userguide/gradle_wrapper.html"]
---
**모범 답변 (30~60초)**
Gradle Wrapper는 프로젝트에 `gradlew` 스크립트와 설정 파일을 함께 두어, 컴퓨터에 설치된 Gradle이 아니라 프로젝트가 정한 버전의 Gradle로 빌드하게 하는 장치입니다. 공식 문서는 이렇게 하면 프로젝트가 특정 Gradle 버전에 고정되어 빌드가 더 믿을 만해지고, 개발자 PC와 IDE, CI 서버의 Gradle 버전을 wrapper 정의 한 곳만 바꿔 맞출 수 있다고 설명합니다. 그래서 wrapper의 jar까지 포함해 버전 관리에 올립니다. 만들거나 올릴 때는 `gradle wrapper` 명령을 씁니다.

```text
$ gradle :wrapper --gradle-version 9.5.1 --no-validate-url
생성: gradlew, gradlew.bat, gradle/wrapper/gradle-wrapper.jar, gradle/wrapper/gradle-wrapper.properties
distributionUrl=https\://services.gradle.org/distributions/gradle-9.5.1-bin.zip
```

(공식 문서) Wrapper 문서는 이점으로 프로젝트의 Gradle 버전 표준화, 사용자와 실행 환경(IDE, CI)별 버전 제공을 wrapper 정의 변경만으로 처리할 수 있다는 점을 든다. wrapper 파일은 jar까지 버전 관리에 넣는 것이 기대되는 방식이며, 버전은 `gradle/wrapper/gradle-wrapper.properties`의 `distributionUrl`에 저장되고 기본 배포 유형은 `-bin`이다.
(실험 확인) Gradle 9.5.1(wrapper 캐시에 받아 둔 배포판의 `gradle`)에서 빈 임시 프로젝트에 `gradle :wrapper --gradle-version 9.5.1 --no-validate-url`을 실행하니 위 파일들이 생겼다. `--no-validate-url`은 URL 검증 요청을 보내지 않으려고 붙인 것이고, 옵션 없이 `gradle :wrapper`만 실행하면 실행한 Gradle과 같은 9.5.1로 `distributionUrl`이 적혔다. 새로 생성한 wrapper로 실제 빌드를 돌려 보지는 않았다.
