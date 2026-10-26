package com.doro.interview.account;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** GET /api/v1/bff/session: 게이트웨이가 붙인 Bearer 로 로그인 상태를 알려 주고, 사용자 행을 한 번만 만든다. */
class SessionApiTest extends AbstractAuthTest {

    private static final String BEARER = "Bearer ";

    private org.springframework.test.web.servlet.ResultActions session(String authorization) throws Exception {
        var request = get("/api/v1/bff/session");
        if (authorization != null) {
            request.header(HttpHeaders.AUTHORIZATION, authorization);
        }
        return mvc.perform(request);
    }

    // -- 비로그인

    @Test
    void 비로그인은_200이고_authenticated_false이며_행을_만들지_않는다() throws Exception {
        session(null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.authenticated").value(false))
                .andExpect(jsonPath("$.data.user").doesNotExist());
        assertThat(userRows()).isZero();
    }

    @Test
    void 쿠키만_보내면_익명이다() throws Exception {
        mvc.perform(get("/api/v1/bff/session").cookie(new jakarta.servlet.http.Cookie("doro_interview_session", "abc")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.authenticated").value(false));
        assertThat(userRows()).isZero();
    }

    @Test
    void 알_수_없는_인증_방식은_익명이다() throws Exception {
        session("Basic dXNlcjpwYXNz").andExpect(status().isOk()).andExpect(jsonPath("$.data.authenticated").value(false));
        session("Bearer").andExpect(status().isOk()).andExpect(jsonPath("$.data.authenticated").value(false));
        session("Bearer not.a.jwt").andExpect(status().isOk()).andExpect(jsonPath("$.data.authenticated").value(false));
    }

    // -- 로그인

    @Test
    void 유효한_토큰은_authenticated_true와_사용자_id를_주고_행이_하나_생긴다() throws Exception {
        UUID id = UUID.randomUUID();
        session(BEARER + DORO.token(id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.authenticated").value(true))
                .andExpect(jsonPath("$.data.user.userId").value(id.toString()));
        assertThat(userRows()).isEqualTo(1);
        // 다시 조회해도 행은 하나다
        session(BEARER + DORO.token(id)).andExpect(jsonPath("$.data.authenticated").value(true));
        assertThat(userRows()).isEqualTo(1);
        assertThat(jdbc.queryForObject("select deleted_at is null from interview_user where user_id = ?", Boolean.class, id)).isTrue();
    }

    @Test
    void 클라이언트_토큰이_아닌_Doro_사용자_토큰도_받는다() throws Exception {
        session(BEARER + DORO.tokenWithoutClient(UUID.randomUUID())).andExpect(jsonPath("$.data.authenticated").value(true));
    }

    @Test
    void 세션_조회는_어디에도_저장하지_않는다() throws Exception {
        session(null).andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store")).andExpect(header().doesNotExist(HttpHeaders.ETAG));
        session(BEARER + DORO.token(UUID.randomUUID()))
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store")).andExpect(header().doesNotExist(HttpHeaders.ETAG));
    }

    @Test
    void 응답에는_이메일_역할_세션_id가_없다() throws Exception {
        UUID id = UUID.randomUUID();
        session(BEARER + DORO.token(id))
                .andExpect(jsonPath("$.data.user.length()").value(2))
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(content().string(not(containsString("user@example.test"))))
                .andExpect(content().string(not(containsString("USER"))))
                .andExpect(content().string(not(containsString("sid"))))
                .andExpect(content().string(not(containsString("role"))));
    }

    @Test
    void 관리자_역할만_admin_true이고_역할_문자열은_싣지_않는다() throws Exception {
        for (String role : new String[]{"ADMIN", "SUPER_ADMIN"}) {
            session(BEARER + DORO.tokenWithRole(UUID.randomUUID(), role))
                    .andExpect(jsonPath("$.data.authenticated").value(true))
                    .andExpect(jsonPath("$.data.user.admin").value(true))
                    .andExpect(content().string(not(containsString(role))));
        }
        session(BEARER + DORO.tokenWithRole(UUID.randomUUID(), "USER")).andExpect(jsonPath("$.data.user.admin").value(false));
        session(BEARER + DORO.token(UUID.randomUUID())).andExpect(jsonPath("$.data.user.admin").value(false));
    }

    @Test
    void 비로그인과_탈퇴한_관리자는_admin_플래그가_없다() throws Exception {
        session(null).andExpect(jsonPath("$.data.user").doesNotExist());
        UUID id = UUID.randomUUID();
        jdbc.update("insert into interview_user (user_id, deleted_at) values (?, now())", id);
        session(BEARER + DORO.tokenWithRole(id, "ADMIN"))
                .andExpect(jsonPath("$.data.authenticated").value(false))
                .andExpect(jsonPath("$.data.user").doesNotExist());
    }

    @Test
    void 같은_사용자가_동시에_여러_번_조회해도_행은_하나다() throws Exception {
        UUID id = UUID.randomUUID();
        String token = BEARER + DORO.token(id);
        ExecutorService pool = Executors.newFixedThreadPool(10);
        try {
            List<Callable<Integer>> calls = new ArrayList<>();
            for (int i = 0; i < 10; i++) {
                calls.add(() -> session(token).andReturn().getResponse().getStatus());
            }
            for (Future<Integer> f : pool.invokeAll(calls)) {
                assertThat(f.get()).isEqualTo(200);
            }
        } finally {
            pool.shutdownNow();
        }
        assertThat(userRows()).isEqualTo(1);
    }

    @Test
    void 사용자마다_행이_따로_생긴다() throws Exception {
        session(BEARER + DORO.token(UUID.randomUUID()));
        session(BEARER + DORO.token(UUID.randomUUID()));
        assertThat(userRows()).isEqualTo(2);
    }

    // -- 믿을 수 없는 토큰은 모두 익명

    @Test
    void 만료_위조_다른_클라이언트_sub_없음은_익명이고_행을_만들지_않는다() throws Exception {
        UUID id = UUID.randomUUID();
        for (String token : new String[]{DORO.expired(id), DORO.forged(id), DORO.tokenForClient(id, "doro-games"), DORO.withoutSubject()}) {
            session(BEARER + token).andExpect(status().isOk()).andExpect(jsonPath("$.data.authenticated").value(false));
        }
        assertThat(userRows()).isZero();
    }

    @Test
    void 토큰의_일부를_바꾸면_익명이다() throws Exception {
        String token = DORO.token(UUID.randomUUID());
        String tampered = token.substring(0, token.length() - 4) + (token.endsWith("AAAA") ? "BBBB" : "AAAA");
        session(BEARER + tampered).andExpect(jsonPath("$.data.authenticated").value(false));
        assertThat(userRows()).isZero();
    }

    // -- 탈퇴한 사용자

    @Test
    void 탈퇴_표식이_있는_사용자는_유효한_토큰이어도_익명이고_되살아나지_않는다() throws Exception {
        UUID id = UUID.randomUUID();
        jdbc.update("insert into interview_user (user_id, deleted_at) values (?, now())", id);
        session(BEARER + DORO.token(id)).andExpect(status().isOk()).andExpect(jsonPath("$.data.authenticated").value(false));
        assertThat(userRows()).isEqualTo(1);
        assertThat(jdbc.queryForObject("select deleted_at is not null from interview_user where user_id = ?", Boolean.class, id)).isTrue();
    }

    @Test
    void 탈퇴하지_않은_다른_사용자는_영향이_없다() throws Exception {
        UUID gone = UUID.randomUUID();
        jdbc.update("insert into interview_user (user_id, deleted_at) values (?, now())", gone);
        session(BEARER + DORO.token(UUID.randomUUID())).andExpect(jsonPath("$.data.authenticated").value(true));
    }
}
