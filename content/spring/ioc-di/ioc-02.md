---
slug: "ioc-02"
topic: "ioc-di"
tier: BASIC
difficulty: 1
title: "생성자 주입이 필드/세터 주입보다 권장되는 이유는 무엇인가요?"
keywords: ["불변성(final)", "null 방지", "완전히 초기화된 객체", "필수/선택 구분", "책임 과다 신호", "테스트 용이성"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
공식 문서가 필수 의존성에는 생성자 주입, 선택적 의존성에는 세터 주입을 권하고, Spring 팀도 대체로 생성자 주입을 선호한다고 밝힙니다. 이유는 첫째 필드를 final로 두어 불변 객체를 만들 수 있고, 둘째 필수 의존성이 null이 아님이 보장되며, 셋째 생성이 끝난 시점에 항상 완전히 초기화된 객체가 호출자에게 전달되기 때문입니다. 또 생성자 인자가 너무 많아지면 클래스 책임이 과하다는 신호로 읽을 수 있습니다. 필드 주입은 final을 쓸 수 없고, 스프링 없이 단위 테스트할 때 의존성을 넣을 방법이 리플렉션뿐이라 불편합니다.

- (공식 문서) 위 세 가지 이점과 "생성자 인자가 많으면 코드 냄새"라는 언급, 세터 주입은 합리적 기본값이 있는 선택 의존성과 재설정(예: JMX 관리)에 적합하다는 설명은 공식 문서 내용이다.
- (보충) 필드 주입이 테스트에 불편하다는 점과 순환 의존을 숨기기 쉽다는 점은 필자의 부연이다. 생성자 주입은 순환 의존을 시작 시점에 바로 드러낸다.
- 데모 프로젝트: `MemberService`가 `@RequiredArgsConstructor`와 `private final MemberRepository`로 생성자 주입을 쓴다.

```java
@Service
@RequiredArgsConstructor           // final 필드 기반 생성자를 Lombok이 생성
public class MemberService {
    private final MemberRepository memberRepository;   // 불변, null 아님
}
```
