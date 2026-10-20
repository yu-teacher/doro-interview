---
slug: "bld-06"
topic: "dev-build"
tier: BASIC
difficulty: 1
title: "Maven의 라이프사이클과 단계(phase)는 무엇이고, `mvn package`와 `mvn verify`는 어떻게 다른가요?"
keywords: ["default 라이프사이클", "앞 단계까지 순서대로 실행", "phase에 묶인 plugin goal", "확실하지 않으면 verify"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://maven.apache.org/guides/introduction/introduction-to-the-lifecycle.html"]
---
**모범 답변 (30~60초)**
Maven에는 default, clean, site 세 개의 라이프사이클이 있고, 각 라이프사이클은 단계(phase)의 순서로 정의됩니다. default는 validate, compile, test, package, verify, install, deploy 순이며, 한 단계를 지정하면 그 앞 단계가 모두 차례로 실행됩니다. `package`는 컴파일된 코드를 jar 같은 배포 형태로 묶는 단계이고, `verify`는 그 뒤에 통합 테스트 결과 검사 같은 품질 확인까지 하는 단계입니다. 문서는 무엇을 원하는지 확실하지 않으면 `mvn verify`를 권하고, 각 단계가 하는 일은 거기에 묶인 플러그인 goal이 합니다.

```text
mvn verify          # validate -> compile -> test -> package -> verify
mvn clean deploy    # clean 라이프사이클 후 default 를 deploy 까지
```

(공식 문서) Maven 라이프사이클 소개 가이드에 근거한다. 단계 설명은 package가 컴파일된 코드를 jar 같은 배포 형식으로 묶는 것, verify가 통합 테스트 결과에 대한 품질 기준 검사를 하는 것, install이 로컬 저장소에 설치하는 것, deploy가 원격 저장소에 복사하는 것이다. 단계는 goal이 묶여야 실제로 동작하며, jar 패키징에서는 compile에 `compiler:compile`, test에 `surefire:test`, package에 `jar:jar`가 묶인다. 이 페이지에는 Maven 4를 언급하는 대목도 있으며, Maven은 이 PC에 없어 실행해 보지 않았다.
