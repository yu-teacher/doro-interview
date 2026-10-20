---
slug: "jpa-20"
topic: "jpa"
tier: DEEP
difficulty: 2
title: "엔티티에 `@Data`나 `@Setter`를 쓰면 안 되는 이유는?"
keywords: ["@Data 금지", "toString 순환 참조", "hashCode로 지연 로딩", "setter 대신 도메인 메서드", "기본 생성자 protected"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html", "https://docs.hibernate.org/orm/7.0/introduction/html_single/"]
concepts: [entity-mapping, equals-hashcode]
importance: 2
links: [{to: "jpa-21", kind: FOLLOWUP}, {to: "jo-07", kind: RELATED}]
---
**모범 답변 (30~60초)**
Lombok의 `@Data`는 `equals/hashCode/toString`을 모든 필드 기준으로 만들기 때문에 엔티티에는 위험합니다(보충). 양방향 연관에서 `toString`이 서로를 호출해 무한 재귀가 나거나, `hashCode`가 지연 컬렉션을 건드려 의도치 않은 로딩을 유발할 수 있습니다. Hibernate 입문서도 변경 가능한 필드를 hashCode에 넣지 말라고 합니다. 또 `@Setter`를 열어 두면 어디서든 상태를 바꿀 수 있는데, 사양상 영속 엔티티의 변경은 flush 때 DB에 반영되므로 의도하지 않은 UPDATE가 됩니다. 그래서 `@Getter`와 사양이 허용하는 `protected` 기본 생성자만 두고, 상태 변경은 `update(name)` 같은 의미 있는 도메인 메서드로 한정하며, 생성은 `@Builder`를 붙인 생성자 하나로 제한합니다.

```java
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Member {
    @Id @GeneratedValue Long id;
    private String name;

    @Builder
    public Member(String name) { this.name = name; }

    public void update(String name) { this.name = name; }   // setter 대신 도메인 메서드
}
```

(공식 문서) Jakarta Persistence 3.2 사양 2.1절은 엔티티 클래스에 매개변수 없는 public 또는 protected 생성자가 있어야 하고 final이 아니어야 한다고 한다. 3.3.4절은 영속 엔티티의 변경(필드 값 할당 포함)이 트랜잭션 커밋 시 DB에 반영된다고 한다. Hibernate 입문서 3.25절은 엔티티가 `equals`/`hashCode`를 재정의해야 하고, 변경 가능한 필드와 DB가 생성하는 값은 hashCode에 넣지 말라고 한다.
(보충) `@Data`가 만드는 메서드의 범위, 양방향 연관에서 `toString`이 무한 재귀를 일으키는 것, `hashCode`가 지연 컬렉션을 건드리는 것은 Lombok·Java 동작에 대한 일반 지식이며 위 공식 문서에서 확인하지 않았다.
