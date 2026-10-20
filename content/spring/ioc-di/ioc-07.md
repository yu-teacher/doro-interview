---
slug: "ioc-07"
topic: "ioc-di"
tier: BASIC
difficulty: 1
title: "싱글톤 빈은 스레드 안전한가요? 어떻게 설계해야 하나요?"
keywords: ["공유 인스턴스", "stateless", "요청별 상태는 지역변수/파라미터", "상태 있으면 prototype/request", "초기화 후 변경 상태는 volatile/락"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
싱글톤 빈 자체가 스레드 안전하게 만들어 주지는 않습니다. 하나의 인스턴스를 여러 요청 스레드가 동시에 공유하기 때문에, 인스턴스 필드에 요청별 상태를 담으면 데이터가 섞입니다. 그래서 싱글톤은 stateless로 설계해야 합니다. 의존성은 final 필드로 두고, 요청별 값은 메서드 파라미터와 지역 변수로 처리합니다. 상태가 꼭 필요하면 그 빈은 prototype이나 request 스코프로 두거나 동시성 제어를 해야 합니다. 공식 문서도 상태 있는 빈에는 prototype, 상태 없는 빈에는 singleton을 권합니다.

- (공식 문서) 상태 있는 빈은 prototype, 상태 없는 빈은 singleton이라는 권고. 라이프사이클 페이지에는 초기화 중 설정한 구성은 컨테이너가 안전하게 게시하므로 volatile이 필요 없지만, 초기화 이후 바뀌는 상태(예: running 플래그)는 volatile이나 락이 필요하다는 언급이 있다.
- (보충) Controller/Service에 `private int count;` 같은 필드를 두는 것이 대표적인 안티패턴이다. 데모의 `MemberService`는 변하는 필드가 없는(final repository만 가진) stateless 설계다.
