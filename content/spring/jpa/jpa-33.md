---
slug: "jpa-33"
topic: "jpa"
tier: BASIC
difficulty: 1
title: "@Embeddable 값 타입은 무엇이고 엔티티와 어떻게 다른가요?"
keywords: ["@Embeddable", "@Embedded", "식별자", "생명주기", "@AttributeOverride"]
has_extra: false
status: DRAFT
sources: ["https://docs.hibernate.org/orm/7.0/introduction/html_single/", "https://docs.hibernate.org/orm/7.0/userguide/html_single/"]
---
**모범 답변 (30~60초)**
@Embeddable은 속성은 있지만 식별자(@Id)가 없는 값 타입입니다. 엔티티의 속성으로만 영속화될 수 있어서 생명주기가 소유 엔티티를 따르고, 보통 소유 엔티티 테이블의 컬럼으로 펼쳐 저장되며 다른 엔티티와 공유할 수 없습니다. 엔티티 쪽에서는 @Embedded를 쓰는데 선택 사항이라 생략하는 경우가 많습니다. 주소나 이름처럼 의미 있는 묶음을 객체로 표현할 때 유용합니다. 같은 임베더블 타입을 한 엔티티에서 두 번 쓰면 기본 컬럼 이름이 겹치므로 @AttributeOverride로 컬럼 이름을 바꿔 주어야 합니다. 입문 가이드는 기본 생성자가 필요하다고 하되 record에는 완화된다고 설명합니다.

```java
@Embeddable
public record Address(String city, String street) {}

@Entity
class Member {
    @Id Long id;
    @Embedded Address home;
    @Embedded
    @AttributeOverride(name = "city", column = @Column(name = "work_city"))
    @AttributeOverride(name = "street", column = @Column(name = "work_street"))
    Address work;
}
```

(공식 문서) 입문 가이드 3.15와 사용자 가이드 3.3에 근거한다. 임베더블 참조는 다형적이지 않다(타입 E 속성에는 항상 E가 들어간다)고 입문 가이드가 말한다. 임베더블 자체가 null일 때의 처리는 읽은 범위에서 확인하지 못해 다루지 않는다.
