---
slug: "boot-14"
topic: "spring-boot"
tier: DEEP
difficulty: 2
title: "테스트 슬라이스(`@SpringBootTest`, `@WebMvcTest`, `@DataJpaTest`)를 비교해 주세요."
keywords: ["슬라이스", "MockMvc", "@MockitoBean", "롤백", "@AutoConfigureTestDatabase", "webEnvironment"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
"`@SpringBootTest`는 전체 애플리케이션 컨텍스트를 올리는 통합 테스트이고, 나머지는 필요한 계층만 올리는 슬라이스 테스트라 빠릅니다. `@WebMvcTest`는 컨트롤러, `@ControllerAdvice`, 필터 같은 웹 계층만 올리고 서비스 같은 일반 `@Component`는 스캔하지 않아서 `@MockitoBean`으로 대체합니다. `@DataJpaTest`는 엔티티와 JPA 리포지토리만 구성하고, 기본으로 테스트마다 트랜잭션을 걸어 끝나면 롤백합니다. 임베디드 DB가 있으면 그것을 쓰고, 실제 DB로 테스트하려면 `@AutoConfigureTestDatabase(replace = NONE)`를 씁니다."

- (실험 확인) `@WebMvcTest(MemberController.class)`는 웹 계층만 올려서 `PostController`, 리포지토리, `DataSource`가 없고, 서비스는 `@MockitoBean`으로 채워야 한다. 이 프로젝트에는 H2가 없어서 기본 `@DataJpaTest`는 "Failed to replace DataSource with an embedded database"로 로딩에 실패한다. `@AutoConfigureTestDatabase(replace = NONE)`으로 실제 DB(dev MySQL)에 붙이면 동작한다. Boot 4에서 패키지가 바뀌었다: `org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest`, `org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest`, `org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase`, `org.springframework.test.context.bean.override.mockito.MockitoBean`. 확인 테스트: `experiment/boot/TestSliceExperimentTest`, `DataJpaSliceExperimentTest`.

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

- 공식 문서: `@SpringBootTest`의 `webEnvironment` 기본은 `MOCK`(서버 미기동), `RANDOM_PORT`는 실제 서버를 랜덤 포트로 띄우고 `@LocalServerPort`로 포트 주입, `DEFINED_PORT`, `NONE`도 있다.
- 공식 문서: 슬라이스 어노테이션을 여러 개 함께 쓰는 것은 지원되지 않고, 하나를 고른 뒤 다른 `@AutoConfigure...`를 추가한다. `@WebMvcTest`는 `MockMvc`를 구성하고 AssertJ가 있으면 `MockMvcTester`도 구성한다.
- 공식 문서: `@DataJpaTest`는 기본적으로 `spring.jpa.show-sql`을 켠다. `TestEntityManager`가 주입 가능하다.
- 이 프로젝트는 `spring-boot-starter-data-jpa-test`, `spring-boot-starter-webmvc-test`를 `testImplementation`으로 사용한다.
- `application.yml`의 기본 프로파일이 dev이므로 슬라이스/통합 테스트도 별도 지정이 없으면 dev 설정(MySQL 접속)을 읽는다는 점을 주의해야 한다. (보충, 데모 설정을 근거로 한 추론)
