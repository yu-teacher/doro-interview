---
slug: "cch-17"
topic: "db-cache"
tier: TRICKY
difficulty: 2
title: "같은 클래스 안에서 `@Cacheable` 메서드를 호출하면 캐시가 동작하지 않는 이유는 무엇인가요?"
keywords: ["프록시 경유 호출만 가로챔", "내부 호출은 this 직접 호출", "별도 빈으로 분리", "AspectJ 모드", "public 메서드에 적용"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/integration/cache/annotations.html"]
---
**모범 답변 (30~60초)**
캐시 어노테이션은 기본이 프록시 모드라서, 스프링이 빈을 감싼 프록시가 바깥에서 들어오는 호출을 가로채 캐시를 확인하는 방식입니다. 같은 클래스의 다른 메서드가 `this`로 `@Cacheable` 메서드를 부르면 프록시를 거치지 않고 원본 객체의 메서드를 바로 호출하기 때문에 캐시 로직이 실행되지 않고, 문서도 같은 클래스 안의 로컬 호출은 가로챌 수 없다고 말합니다. 해결은 캐시 대상 메서드를 다른 빈으로 분리해 주입받아 호출하거나, 바이트코드를 직접 위빙하는 AspectJ 모드로 바꾸는 것입니다. 문서는 프록시 모드에서는 어노테이션을 public 메서드에만 적용하라고 안내합니다.

```java
@Service
class BookService {
    @Cacheable("books")
    public Book find(long id) {...}

    public Book findViaThis(long id) {
        return find(id);   // this.find -> 프록시를 거치지 않음, 캐시 안 탐
    }
}
```

(공식 문서) 어노테이션 페이지의 `@EnableCaching` 설명은 기본 조언 모드가 프록시이며 프록시를 통한 호출만 가로채고 같은 클래스 안의 로컬 호출은 가로챌 수 없다고 하고, 더 고급 모드로 컴파일 타임이나 로드 타임 위빙과 함께 `aspectj` 모드를 고려하라고 한다. 프록시를 쓸 때 어노테이션은 public 메서드에만 적용하라고 하며, protected·private·패키지 가시성 메서드에 붙이면 오류 없이 설정이 적용되지 않는다고 설명한다.
(실험 확인) Spring Framework 7.0.9(`@EnableCaching`, `ConcurrentMapCacheManager`)에서 프록시를 통해 `find(1)`을 두 번 부르면 실제 실행이 1번이었고, `findViaThis(2)`를 두 번 부르면 실행이 2번이며 캐시에 항목이 없었다. 다만 패키지 가시성 `@Cacheable` 메서드는 이 환경(CGLIB 클래스 프록시)에서 두 번 호출에 실행 1번으로 캐시가 동작해 문서의 설명과 달랐다. 이 동작에 기대지 말고 문서대로 public에 붙이는 편이 안전하다.
(보충) 캐시 대상 메서드를 다른 빈으로 분리해 주입받아 호출하는 해결책은 일반적인 관행이며, 위 문서는 이 방법을 직접 설명하지 않고 `aspectj` 모드만 언급한다.
