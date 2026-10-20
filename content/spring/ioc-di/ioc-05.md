---
slug: "ioc-05"
topic: "ioc-di"
tier: BASIC
difficulty: 1
title: "@Qualifier와 @Primary는 각각 언제 쓰고 어떻게 다른가요?"
keywords: ["@Primary(제공자 쪽 기본값)", "@Qualifier(소비자 쪽 선택)", "한정자는 필터", "빈 이름이 기본 한정자", "@Fallback(6.2+)"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/beans/annotation-config/autowired-primary.html", "https://docs.spring.io/spring-framework/reference/core/beans/annotation-config/autowired-qualifiers.html"]
concepts: [ioc-di]
importance: 2
---
**모범 답변 (30~60초)**
같은 타입 빈이 여러 개일 때 모호성을 해소하는 도구입니다. @Primary는 빈 정의 쪽에 붙여 여러 후보 중 우선할 빈을 지정하는 것이고, @Qualifier는 주입받는 쪽에서 이 한정자에 해당하는 빈으로 후보를 좁히는 것입니다. 한정자가 따로 없으면 빈 이름이 기본 한정자 역할을 하지만, 한정자는 고유 ID가 아니라 필터라서 여러 빈이 같은 값을 가질 수 있고 컬렉션 주입에도 쓰입니다. @Primary 빈이 있어도 주입 지점에 @Qualifier를 쓰면 한정자가 지정한 빈이 주입됩니다. 참고로 Spring 6.2부터는 반대 개념인 @Fallback도 있어서, 일반 빈이 아닌 예비 빈을 표시할 수 있습니다.

- (공식 문서) 후보 중 정확히 하나의 primary 빈이 있으면 그것이 주입된다. 6.2부터의 `@Fallback`은 일반 빈이 아닌 빈을 표시하며, 일반 빈이 하나 남으면 사실상 primary가 된다. `@Qualifier`는 타입 일치 후보를 좁히는 필터이며 고유할 필요가 없다(같은 값의 빈 여럿을 `Set<MovieCatalog>`에 모두 주입할 수 있다). 한정자가 없으면 빈 이름이 기본 한정자로 쓰이지만 고유 빈 id를 가리키는 의미는 아니다.
- (실험 확인) `@Primary` 빈이 있는 상태에서 주입 지점의 `@Qualifier("remoteCatalog")`가 지정한 빈이 주입된다(한정자가 우선).

```java
@Configuration
class CatalogConfig {
    @Bean @Primary
    MovieCatalog localCatalog() { return new LocalCatalog(); }
    @Bean
    MovieCatalog remoteCatalog() { return new RemoteCatalog(); }
}

class Recommender {
    Recommender(@Qualifier("remoteCatalog") MovieCatalog catalog) { } // remoteCatalog 가 주입됨
}
```
