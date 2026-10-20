---
slug: "boot-06"
topic: "spring-boot"
tier: BASIC
difficulty: 1
title: "starter와 의존성 관리(BOM)는 무엇인가요?"
keywords: ["starter", "spring-boot-dependencies", "BOM", "버전 일관성"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
"starter는 특정 기능에 필요한 의존성을 한 번에 묶은 의존성 모음입니다. 이름은 `spring-boot-starter-*` 규칙이고, 예를 들어 `spring-boot-starter-data-jpa`를 추가하면 JPA 접근에 필요한 것들이 들어옵니다. 버전은 Boot가 `spring-boot-dependencies`라는 BOM으로 큐레이션해서 관리하기 때문에, 보통 라이브러리 버전을 직접 적지 않고, Boot를 올리면 일관되게 같이 올라갑니다. 공식 문서는 Spring Framework 버전을 직접 지정하지 말라고 권장합니다. 서드파티 starter는 `spring-boot`로 시작하면 안 되고 프로젝트 이름을 앞에 붙입니다."

- 이 프로젝트의 `build.gradle`: `id 'io.spring.dependency-management'` 플러그인과 `spring-boot-starter-data-jpa`, `spring-boot-starter-webmvc`를 버전 없이 선언한다.
- (보충) 버전 오버라이드는 Gradle에서 `ext['hibernate.version'] = '...'` 형태로 하는 것이 일반적이며, 공식 문서 해당 페이지에는 방법이 나와 있지 않고 부록(Version Properties)에서 속성 이름을 확인하라고만 되어 있다.
