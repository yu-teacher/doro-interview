---
slug: "bld-07"
topic: "dev-build"
tier: BASIC
difficulty: 1
title: "버전 끝에 붙는 `-SNAPSHOT`은 무엇을 뜻하나요?"
keywords: ["개발 중인 최신 코드", "내용이 바뀔 수 있음", "릴리스 버전은 불변", "운영 릴리스에서는 피함"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://maven.apache.org/guides/getting-started/index.html", "https://maven.apache.org/guides/introduction/introduction-to-repositories.html", "https://docs.gradle.org/current/userguide/dependency_caching.html", "https://docs.gradle.org/current/userguide/dependency_versions.html"]
---
**모범 답변 (30~60초)**
SNAPSHOT은 개발 브랜치의 최신 코드를 가리키는 버전으로, 안정적이거나 바뀌지 않는다는 보장이 없습니다. 반대로 SNAPSHOT 접미사가 없는 릴리스 버전의 내용은 바뀌지 않습니다. 릴리스할 때 `1.0-SNAPSHOT`은 `1.0`이 되고 다음 개발 버전은 `1.1-SNAPSHOT`이 됩니다. 같은 버전 이름인데 내용이 바뀔 수 있어서 Gradle은 SNAPSHOT을 changing 의존성으로 보고 기본적으로 24시간 동안 캐시하며, Maven은 원격 저장소에 더 새로운 것이 있으면 다시 내려받습니다. 그래서 운영에 나가는 릴리스는 SNAPSHOT에 의존하지 않도록 합니다.

(공식 문서) Maven 시작 가이드는 SNAPSHOT이 개발 중인 최신 코드이며 안정성을 보장하지 않고 릴리스 버전은 바뀌지 않는다고 하고, `1.0-SNAPSHOT`이 `1.0`으로 릴리스되며 다음 개발 버전은 `1.1-SNAPSHOT`이 된다고 설명한다. 저장소 가이드는 SNAPSHOT은 원격 저장소에 더 새로운 것이 있을 때 다시 내려받는다고 한다. Gradle 캐시 문서는 SNAPSHOT을 자동으로 changing으로 취급하며 changing 모듈과 동적 버전을 기본 24시간 캐시하고 TTL은 `resolutionStrategy`로 조정할 수 있다고 한다.
(보충) 운영 릴리스가 SNAPSHOT에 의존하지 않는 것이 좋다는 권고는 같은 이름의 내용이 바뀐다는 위 사실에서 끌어낸 일반 실무 판단이다. SNAPSHOT 갱신 동작은 로컬 파일 저장소로는 원격 캐시를 재현할 수 없어 실행해 확인하지 않았다.
