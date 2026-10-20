package com.doro.interview.account;

import com.doro.interview.support.FakeDoro;
import com.doro.interview.support.IsolatedSchema;
import com.hunnit_beasts.doro.sdk.security.jwks.JwksKeyProvider;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

/**
 * 토큰으로 인증하는 시험의 공통 기반(전용 스키마, 가짜 Doro). 세션 폐기 확인은 끈다(IAM 이 없다).
 * 공개 키는 JWKS 를 가져오는 대신 직접 등록한다(doro-games 시험과 같은 방식).
 */
@SpringBootTest(properties = "interview.content.location=file:build/no-such-content/")
@AutoConfigureMockMvc
public abstract class AbstractAuthTest {

    protected static final FakeDoro DORO = new FakeDoro();

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        String url = IsolatedSchema.createAndGetUrl();
        registry.add("spring.datasource.url", () -> url);
        registry.add("doro.iam.revocation-check", () -> "OFF");
        registry.add("doro.iam.oauth-client-ids", () -> FakeDoro.CLIENT_ID);
        
        registry.add("doro.iam.jwks-prefetch", () -> "false");
    }

    @Autowired
    protected MockMvc mvc;
    @Autowired
    protected JdbcTemplate jdbc;
    @Autowired
    private JwksKeyProvider jwks;

    @BeforeEach
    void registerKeyAndClean() {
        jwks.registerKey(FakeDoro.KID, DORO.publicKey());
        jdbc.execute("TRUNCATE interview_user");
    }

    protected int userRows() {
        return jdbc.queryForObject("select count(*) from interview_user", Integer.class);
    }
}
