---
slug: "jpa-20"
topic: "jpa"
tier: DEEP
difficulty: 2
title: "엔티티에 `@Data`나 `@Setter`를 쓰면 안 되는 이유는?"
keywords: ["@Data 금지", "toString 순환 참조", "hashCode로 지연 로딩", "setter 대신 도메인 메서드", "기본 생성자 protected"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
`@Data`는 `equals/hashCode/toString`을 모든 필드 기준으로 만들기 때문입니다. 양방향 연관에서 `toString`이 `Member`와 `Post`를 서로 호출해 무한 재귀(StackOverflow)가 나거나, `hashCode`가 지연 컬렉션을 건드려 의도치 않은 로딩을 유발합니다. 또 `@Setter`를 열어 두면 어디서든 상태를 바꿀 수 있어 변경 감지가 곧 "의도하지 않은 UPDATE"가 되고, 불변식이 깨집니다. 그래서 데모처럼 `@Getter` + `@NoArgsConstructor(access = PROTECTED)`만 두고, 상태 변경은 `Member.update(name)`, `Post.update(title, content)` 같은 의미 있는 도메인 메서드로 한정합니다. 생성은 `@Builder`를 붙인 생성자 하나로 제한했습니다.
