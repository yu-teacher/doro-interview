---
slug: "mvc-14"
topic: "spring-mvc"
tier: DEEP
difficulty: 2
title: "엔티티를 그대로 반환하지 않고 DTO를 쓰는 이유는 무엇인가요?"
keywords: ["DTO", "엔티티 노출", "API 계약", "지연 로딩", "순환 참조", "mass assignment", "record"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/modelattrib-method-args.html"]
---
**모범 답변 (30~60초)**
엔티티를 요청·응답에 그대로 쓰면 DB 스키마와 API 계약이 한 덩어리가 되어, 스키마 변경이 곧바로 API 변경이 되고 비밀번호 같은 내부 필드가 노출될 수 있습니다. 지연 로딩 연관관계를 직렬화하면 의도치 않은 추가 쿼리나 `LazyInitializationException`, 양방향 참조 순환이 생길 수 있습니다. 요청 쪽에서는 클라이언트가 수정하면 안 될 필드까지 바인딩되는 mass assignment 위험이 있습니다. Spring 문서도 `@ModelAttribute` 데이터 바인딩에서는 보안상 웹 바인딩 전용으로 만든 객체를 쓰거나 생성자 바인딩만 쓰라고 권장합니다. 그래서 `record` 같은 DTO를 별도로 두고 엔티티와 DTO 사이를 변환합니다.

- (공식 문서, @ModelAttribute) 기본적으로 생성자 바인딩과 프로퍼티 바인딩이 모두 적용되지만 모델 객체 설계는 신중해야 하며, 보안상 웹 바인딩 전용으로 만든 객체를 쓰거나 생성자 바인딩만 적용하라고 권장한다. 프로퍼티 바인딩을 써야 하면 `allowedFields` 패턴으로 설정 가능한 프로퍼티를 제한한다.
- (보충) 스키마 변경 전파, 내부 필드 노출, 지연 로딩 직렬화 문제, 순환 참조, 요청 본문(JSON) 쪽 과바인딩 위험은 공식 문서에서 확인한 사실이 아니라 설계 관행에 대한 설명이다. 위 문서 문장은 폼·쿼리 바인딩(`@ModelAttribute`)에 관한 것이다.
- (실험 확인) `id`, `name`, `email` 필드만 가진 `record` 응답 DTO를 반환하면 JSON에는 그 세 필드만 나오고 엔티티의 연관 컬렉션(`posts` 등)은 나오지 않는다.

```java
public record MemberResponse(Long id, String name, String email) {
    public static MemberResponse from(Member member) {
        return new MemberResponse(member.getId(), member.getName(), member.getEmail());
    }
}
```
