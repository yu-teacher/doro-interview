---
slug: "boot-14"
topic: "spring-boot"
tier: DEEP
difficulty: 2
title: "테스트 슬라이스(`@SpringBootTest`, `@WebMvcTest`, `@DataJpaTest`)를 비교해 주세요."
keywords: ["슬라이스", "MockMvc", "@MockitoBean", "롤백", "@AutoConfigureTestDatabase", "webEnvironment"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-boot/reference/testing/spring-boot-applications.html", "https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide"]
concepts: [test-strategy, mocking-junit]
importance: 2
links: [{to: "tst-11", kind: RELATED}, {to: "tst-12", kind: RELATED}, {to: "tst-15", kind: RELATED}]
---
**모범 답변 (30~60초)**
`@SpringBootTest`는 `SpringApplication`으로 전체 컨텍스트를 올리는 통합 테스트이고, `webEnvironment` 기본값은 서버를 띄우지 않는 `MOCK`입니다. 나머지는 필요한 계층만 올리는 슬라이스 테스트입니다. `@WebMvcTest`는 컨트롤러, `@ControllerAdvice`, 필터 같은 웹 계층만 스캔하고 일반 `@Component`는 스캔하지 않아서 협력 객체는 `@MockitoBean`으로 대체하며, `MockMvc`를 구성합니다. `@DataJpaTest`는 엔티티와 JPA 리포지토리를 구성하고 기본으로 각 테스트를 트랜잭션으로 감싸 끝나면 롤백합니다. 임베디드 DB가 있으면 그것을 쓰고, 실제 DB는 `@AutoConfigureTestDatabase(replace = NONE)`로 씁니다.

```java
@WebMvcTest(PostController.class)
class PostControllerTest {
    @Autowired MockMvcTester mvc;
    @MockitoBean PostService postService;   // 서비스는 목으로 대체
}

@DataJpaTest
class PostRepositoryTest {
    @Autowired TestEntityManager em;
    @Autowired PostRepository repository;
}
```

- 공식 문서: `@SpringBootTest`는 기본으로 서버를 시작하지 않는다. `webEnvironment`는 `MOCK`(기본, 모의 웹 환경), `RANDOM_PORT`(실제 서버를 랜덤 포트로 기동, `@LocalServerPort`로 주입), `DEFINED_PORT`(설정된 포트 또는 8080), `NONE`이다. 테스트가 `@Transactional`이면 기본으로 롤백되지만 RANDOM_PORT/DEFINED_PORT에서는 클라이언트와 서버가 다른 스레드·트랜잭션이라 서버 쪽 트랜잭션은 롤백되지 않는다.
- 공식 문서: 슬라이스는 컴포넌트 스캔을 적절한 컴포넌트로 한정하고 매우 제한된 자동 설정만 로드한다. 여러 슬라이스 `@…Test`를 한 테스트에 함께 쓰는 것은 지원되지 않고, 하나를 고른 뒤 다른 슬라이스의 `@AutoConfigure…`를 직접 추가한다.
- 공식 문서: `@WebMvcTest`는 `@Controller`, `@ControllerAdvice`, `@JacksonComponent`, `Converter`, `Filter`, `HandlerInterceptor`, `WebMvcConfigurer` 등으로 스캔을 한정하고 일반 `@Component`와 `@ConfigurationProperties`는 스캔하지 않는다. 보통 `@MockitoBean`과 함께 쓰며 `MockMvc`를 구성하고 AssertJ가 있으면 `MockMvcTester`도 구성한다.
- 공식 문서: `@DataJpaTest`는 `@Entity`를 스캔하고 Spring Data JPA 리포지토리를 구성하며, 클래스패스에 임베디드 DB가 있으면 그것도 구성한다. 기본으로 `spring.jpa.show-sql`이 켜지고 `TestEntityManager`를 주입할 수 있으며, 테스트는 트랜잭션이고 끝날 때 롤백된다. 실제 DB를 쓰려면 `@AutoConfigureTestDatabase(replace = Replace.NONE)`을 쓴다.
- 공식 문서(마이그레이션 가이드): Boot 4에서 `@MockBean`/`@SpyBean`은 제거되고 `@MockitoBean`/`@MockitoSpyBean`(Spring Framework, `org.springframework.test.context.bean.override.mockito`)을 쓴다. 또 `@SpringBootTest`만으로는 더 이상 MockMvc가 제공되지 않아서 `@AutoConfigureMockMvc`를 붙여야 한다. 슬라이스 패키지도 바뀌어 `org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest`, `org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest`, `org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase`이다.
- (실험 확인) `@WebMvcTest(특정 컨트롤러)`로 띄우면 그 컨트롤러와 웹 인프라만 있고 다른 컨트롤러, 리포지토리, `DataSource` 빈은 없다. 서비스는 `@MockitoBean`으로 채워야 하고 `MockMvc`로 컨트롤러를 검증할 수 있다. 임베디드 DB가 클래스패스에 없는 프로젝트에서 기본 `@DataJpaTest`는 DataSource를 임베디드 DB로 교체하지 못해 컨텍스트 로딩이 실패했고, `@AutoConfigureTestDatabase(replace = NONE)`을 붙이면 실제 DB로 JPA 슬라이스가 떠서 리포지토리 빈은 있고 컨트롤러는 로드되지 않았다.
- (보충) 활성 프로파일이 없으면 `default` 프로파일이 켜지므로(프로파일 문서), 기본 프로파일을 `spring.profiles.default`로 지정한 프로젝트에서는 테스트도 별도 지정이 없으면 그 프로파일 설정을 읽을 것이다. 테스트 문서가 이 점을 직접 설명하지는 않는다.
