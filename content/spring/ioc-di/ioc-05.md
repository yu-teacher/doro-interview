---
slug: "ioc-05"
topic: "ioc-di"
tier: BASIC
difficulty: 1
title: "@Qualifier와 @Primary는 각각 언제 쓰고 어떻게 다른가요?"
keywords: ["@Primary(제공자 쪽 기본값)", "@Qualifier(소비자 쪽 선택)", "한정자는 필터", "빈 이름이 기본 한정자", "@Fallback(6.2+)"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
같은 타입 빈이 여러 개일 때 모호성을 해소하는 도구입니다. @Primary는 빈 정의 쪽에 붙여 "기본으로 이걸 써라"라고 지정하는 것이고, @Qualifier는 주입받는 쪽에서 "이 라벨의 빈을 달라"고 명시하는 것입니다. 보통은 가장 흔히 쓰는 구현을 @Primary로 두고, 예외적으로 다른 구현이 필요한 곳에서만 @Qualifier로 지정합니다. @Qualifier는 고유 ID가 아니라 필터라서 여러 빈이 같은 값을 가질 수 있고, 한정자가 따로 없으면 빈 이름이 기본 한정자 역할을 합니다. 참고로 Spring 6.2부터는 반대 개념인 @Fallback도 있어서, 다른 후보가 없을 때만 쓰이는 예비 빈을 표시할 수 있습니다.

- (공식 문서) @Primary, @Fallback(6.2 이후), @Qualifier의 필터 성격, 빈 이름이 기본 한정자가 된다는 내용 모두 공식 문서 기준이다.

```java
@Configuration
class CatalogConfig {
    @Bean @Primary
    MovieCatalog localCatalog() { return new LocalCatalog(); }
    @Bean
    MovieCatalog remoteCatalog() { return new RemoteCatalog(); }
}

class Recommender {
    Recommender(@Qualifier("remoteCatalog") MovieCatalog catalog) { } // primary보다 한정자가 좁힘
}
```
