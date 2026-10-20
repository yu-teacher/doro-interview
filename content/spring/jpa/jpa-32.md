---
slug: "jpa-32"
topic: "jpa"
tier: DEEP
difficulty: 2
title: "JPA 상속 매핑 전략(SINGLE_TABLE, JOINED, TABLE_PER_CLASS)은 어떻게 다른가요?"
keywords: ["SINGLE_TABLE", "JOINED", "TABLE_PER_CLASS", "discriminator", "@MappedSuperclass"]
has_extra: false
status: DRAFT
sources: ["https://docs.hibernate.org/orm/7.0/introduction/html_single/", "https://docs.hibernate.org/orm/7.0/userguide/html_single/"]
---
**모범 답변 (30~60초)**
세 가지 전략이 있습니다. SINGLE_TABLE은 계층 전체를 한 테이블에 넣고 discriminator 컬럼으로 행의 클래스를 구분하는데, 조인이 없는 대신 하위 클래스 컬럼에 NOT NULL을 걸 수 없고 데이터가 비정규화됩니다. JOINED는 클래스마다 자기 속성만 가진 테이블을 두고 조회할 때 조인하므로 정규화되고 제약 조건을 모두 걸 수 있습니다. TABLE_PER_CLASS는 구체 클래스마다 상속받은 속성까지 모두 가진 테이블을 두며, 다형성 조회에 UNION이 필요하고 상위 타입을 가리키는 외래 키를 만들 수 없어서 인기가 적다고 가이드는 설명합니다. 기본 전략은 SINGLE_TABLE입니다. 참고로 테이블 관계 없이 공통 필드만 물려주고 싶다면 엔티티가 아닌 @MappedSuperclass를 씁니다.

```java
@Entity
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "dtype")
public abstract class Item { @Id @GeneratedValue Long id; }
```

(공식 문서) Hibernate 입문 가이드 4.1(상속 계층 매핑)과 3.3(엔티티 클래스 상속)에 근거한다. 하위 엔티티는 루트의 식별자를 상속하며 자기 @Id를 선언할 수 없다고 문서가 말한다. JOINED에서 discriminator는 선택이다.
