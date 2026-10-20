---
slug: "ioc-11"
topic: "ioc-di"
tier: DEEP
difficulty: 2
title: "@Component와 @Bean은 어떻게 다르고, 언제 각각 쓰나요?"
keywords: ["클래스 대상 vs 메서드 대상", "스캔 자동 등록 vs 명시적 팩토리", "외부 라이브러리 객체", "lite/full 모드"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
@Component는 클래스에 붙이며 컴포넌트 스캔이 그 클래스를 찾아 빈으로 등록합니다. 반면 @Bean은 메서드에 붙이며, 메서드가 반환한 객체를 빈으로 등록합니다. 내가 소스를 수정할 수 있는 클래스는 @Component 계열로 간단히 등록하고, 외부 라이브러리 클래스처럼 애노테이션을 달 수 없는 것, 또는 생성 과정에 조건과 로직이 필요한 객체는 @Bean으로 직접 생성해 등록합니다. 또한 @Bean 메서드는 @Configuration뿐 아니라 일반 @Component 안에도 선언할 수 있지만 동작 모드가 다릅니다.

- (공식 문서) @Bean은 어떤 @Component에서도 선언 가능하며, @Configuration에서는 CGLIB 강화로 메서드 간 호출이 싱글톤을 반환하고 @Component에서는 평범한 자바 호출이 되어 매번 새 인스턴스가 만들어진다.
- (보충) 외부 라이브러리 객체에 @Bean을 쓰는 것은 일반적인 용례이며, 문서에서 이 문장을 그대로 확인한 것은 아니다.

```java
@Configuration
class AppConfig {
    @Bean ObjectMapper objectMapper() { return new ObjectMapper(); }  // 외부 클래스
}
```
