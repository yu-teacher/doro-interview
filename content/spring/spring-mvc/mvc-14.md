---
slug: "mvc-14"
topic: "spring-mvc"
tier: DEEP
difficulty: 2
title: "엔티티를 그대로 반환하지 않고 DTO를 쓰는 이유는 무엇인가요?"
keywords: ["DTO", "엔티티 노출", "API 계약", "지연 로딩", "순환 참조", "mass assignment", "record"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
"엔티티를 API 응답이나 요청에 그대로 쓰면 DB 스키마 변경이 곧바로 API 계약 변경이 되고, 비밀번호 같은 내부 필드가 노출될 수 있습니다. 지연 로딩 연관관계를 직렬화하다가 N+1이나 `LazyInitializationException`, 양방향 참조 순환이 생기기도 하고, 요청에 엔티티를 쓰면 클라이언트가 수정하면 안 될 필드까지 바인딩되는 mass assignment 위험이 있습니다. 데모는 `MemberRequest`, `MemberResponse` 같은 record DTO를 쓰고 `MemberResponse.from(member)`로 변환해 이 문제를 피합니다."

- (보충) 이 질문의 내용은 공식 문서에서 확인한 사실이 아니라 설계 관행에 대한 제 설명입니다. 데모 코드(`MemberResponse.from`)만 직접 확인했습니다.

```java
public record MemberResponse(Long id, String name, String email) {
    public static MemberResponse from(Member member) {
        return new MemberResponse(member.getId(), member.getName(), member.getEmail());
    }
}
```
