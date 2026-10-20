---
slug: "sec-09"
topic: "spring-security"
tier: DEEP
difficulty: 2
title: "DelegatingPasswordEncoder는 무엇이고, 저장된 비밀번호에 접두사가 없으면 어떻게 되나요?"
keywords: ["DelegatingPasswordEncoder", "{id}", "idForEncode", "IllegalArgumentException", "setDefaultPasswordEncoderForMatches"]
has_extra: false
status: DRAFT
sources: ["https://docs.spring.io/spring-security/reference/features/authentication/password-storage.html"]
---
**모범 답변 (30~60초)**
DelegatingPasswordEncoder는 스프링 시큐리티가 기본으로 쓰는 인코더로, 저장 형식은 {id}encodedPassword입니다. 문서가 드는 이유는 세 가지입니다. 이미 오래된 인코딩을 쓰는 앱이 많고, 모범 사례가 앞으로 또 바뀌며, 프레임워크가 호환성을 깨는 변경을 자주 할 수 없다는 점입니다. 인코딩은 idForEncode로 지정한 인코더가 하고 결과 앞에 그 id를 붙이며, 검증은 저장된 값의 {id}로 인코더를 골라 합니다. 문서 예시는 idForEncode로 bcrypt를 씁니다. 매핑되지 않았거나 id가 없으면 기본적으로 matches가 IllegalArgumentException을 던지고, setDefaultPasswordEncoderForMatches로 바꿀 수 있습니다.

(공식 문서) Password Storage 페이지에 근거한다. "id가 null" 오류 메시지의 해결책으로 같은 페이지가 접두사 추가를 안내한다. 이 페이지는 `PasswordEncoderFactories`가 만드는 기본 id 전체 목록은 Javadoc 참조로 넘긴다.
