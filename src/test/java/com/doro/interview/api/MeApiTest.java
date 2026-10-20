package com.doro.interview.api;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import tools.jackson.databind.JsonNode;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** 현황·설정·다시 공부 후보 API와 사전 응답의 reviewCandidate 합성(docs/M3-PLAN.md D6, S5). */
class MeApiTest extends AbstractProgressApiTest {

    private static final String START = "{\"count\":10,\"includeUnlearned\":true}";

    private void check(UUID user, String... slugs) throws Exception {
        for (String slug : slugs) {
            putAs(user, "/api/v1/progress/" + slug, "{\"learned\":true}").andExpect(status().isOk());
        }
    }

    /** 새 세션을 시작하고 slug 하나의 결과를 기록한다. */
    private void answer(UUID user, String slug, String result) throws Exception {
        UUID id = UUID.randomUUID();
        var view = json.readTree(bodyOf(putAs(user, "/api/v1/quiz/" + id, START).andExpect(status().isOk()))).at("/data/items");
        for (JsonNode item : view) {
            if (item.get("questionSlug").asText().equals(slug)) {
                putAs(user, "/api/v1/quiz/" + id + "/items/" + item.get("seq").asInt(), "{\"result\":\"" + result + "\"}").andExpect(status().isOk());
                return;
            }
        }
        throw new AssertionError(slug + " 가 세션에 없다");
    }

    // -- 인증

    @Test
    void 비로그인은_현황_설정_후보가_모두_401이다() throws Exception {
        getAs(null, "/api/v1/me/stats").andExpect(status().isUnauthorized());
        getAs(null, "/api/v1/me/prefs").andExpect(status().isUnauthorized());
        putAs(null, "/api/v1/me/prefs", "{\"includeUnlearnedDefault\":true}").andExpect(status().isUnauthorized());
        getAs(null, "/api/v1/review-candidates").andExpect(status().isUnauthorized());
    }

    // -- 설정

    @Test
    void 설정은_기본이_꺼짐이고_저장하면_바뀌며_저장하지_않는다() throws Exception {
        getAs(alice, "/api/v1/me/prefs").andExpect(status().isOk()).andExpect(jsonPath("$.data.includeUnlearnedDefault").value(false))
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store"));
        putAs(alice, "/api/v1/me/prefs", "{\"includeUnlearnedDefault\":true}").andExpect(status().isOk()).andExpect(jsonPath("$.data.includeUnlearnedDefault").value(true));
        getAs(alice, "/api/v1/me/prefs").andExpect(jsonPath("$.data.includeUnlearnedDefault").value(true));
        getAs(bob, "/api/v1/me/prefs").andExpect(jsonPath("$.data.includeUnlearnedDefault").value(false));
    }

    @Test
    void 잘못된_설정_본문은_400이다() throws Exception {
        String[] bad = {"{}", "{\"includeUnlearnedDefault\":\"true\"}", "{\"includeUnlearnedDefault\":null}", "{\"includeUnlearnedDefault\":1}",
                "{\"includeUnlearnedDefault\":true,\"userId\":\"" + bob + "\"}", "{\"x\":true}", "[true]"};
        for (String b : bad) {
            putAs(alice, "/api/v1/me/prefs", b).andExpect(status().isBadRequest());
        }
        getAs(alice, "/api/v1/me/prefs").andExpect(jsonPath("$.data.includeUnlearnedDefault").value(false));
    }

    // -- 현황

    @Test
    void 현황은_수치와_자주_틀린_질문을_주고_제목이_붙는다() throws Exception {
        check(alice, "aa-01", "aa-02");
        answer(alice, "aa-01", "WRONG");
        answer(alice, "aa-02", "CORRECT");
        getAs(alice, "/api/v1/me/stats").andExpect(status().isOk()).andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store"))
                .andExpect(jsonPath("$.data.askedLast30Days").value(2)).andExpect(jsonPath("$.data.correctLast30Days").value(1))
                .andExpect(jsonPath("$.data.wrongLast30Days").value(1)).andExpect(jsonPath("$.data.sessionsLast30Days").value(2))
                .andExpect(jsonPath("$.data.mostMissed", hasSize(1))).andExpect(jsonPath("$.data.mostMissed[0].questionSlug").value("aa-01"))
                .andExpect(jsonPath("$.data.mostMissed[0].title").value("심화 질문")).andExpect(jsonPath("$.data.mostMissed[0].missCount").value(1));
    }

    @Test
    void 현황의_자주_틀린_질문에서_닫힌_질문은_빠진다() throws Exception {
        check(alice, "aa-01", "aa-03");
        answer(alice, "aa-03", "WRONG");
        fx.delete("c1", "t1", "aa-03");
        loader.load(fx.location());
        getAs(alice, "/api/v1/me/stats").andExpect(jsonPath("$.data.mostMissed", hasSize(0)));
    }

    @Test
    void 현황은_다른_사용자의_기록을_섞지_않는다() throws Exception {
        check(alice, "aa-01");
        answer(alice, "aa-01", "WRONG");
        getAs(bob, "/api/v1/me/stats").andExpect(jsonPath("$.data.askedLast30Days").value(0)).andExpect(jsonPath("$.data.mostMissed", hasSize(0)));
    }

    // -- 다시 공부 후보

    @Test
    void 체크했고_마지막이_틀림이면_후보이고_맞으면_사라진다() throws Exception {
        check(alice, "aa-01", "aa-02");
        answer(alice, "aa-01", "WRONG");
        getAs(alice, "/api/v1/review-candidates").andExpect(status().isOk()).andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store"))
                .andExpect(jsonPath("$.data", hasSize(1))).andExpect(jsonPath("$.data[0].slug").value("aa-01")).andExpect(jsonPath("$.data[0].title").value("심화 질문"));
        answer(alice, "aa-01", "CORRECT");
        getAs(alice, "/api/v1/review-candidates").andExpect(jsonPath("$.data", hasSize(0)));
    }

    @Test
    void 체크하지_않은_질문은_틀려도_후보가_아니다() throws Exception {
        check(alice, "aa-02");
        answer(alice, "aa-01", "WRONG"); // 미학습 포함 시험에서 체크하지 않은 질문을 틀렸다
        getAs(alice, "/api/v1/review-candidates").andExpect(jsonPath("$.data", hasSize(0)));
        // 사전 응답의 표시도 같다: 체크하지 않은 질문은 틀렸어도 후보 표시가 없다
        getAs(alice, "/api/v1/questions/aa-01").andExpect(jsonPath("$.data.reviewCandidate").value(false));
        getAs(alice, "/api/v1/topics/t1").andExpect(jsonPath("$.data.questions[?(@.slug=='aa-01')].reviewCandidate").value(false));
    }

    @Test
    void 체크를_해제하면_후보에서도_빠진다() throws Exception {
        check(alice, "aa-01");
        answer(alice, "aa-01", "WRONG");
        getAs(alice, "/api/v1/review-candidates").andExpect(jsonPath("$.data", hasSize(1)));
        putAs(alice, "/api/v1/progress/aa-01", "{\"learned\":false}").andExpect(status().isOk());
        getAs(alice, "/api/v1/review-candidates").andExpect(jsonPath("$.data", hasSize(0)));
        getAs(alice, "/api/v1/questions/aa-01").andExpect(jsonPath("$.data.reviewCandidate").value(false));
    }

    @Test
    void 후보는_사용자별이다() throws Exception {
        check(alice, "aa-01");
        answer(alice, "aa-01", "WRONG");
        getAs(bob, "/api/v1/review-candidates").andExpect(jsonPath("$.data", hasSize(0)));
    }

    // -- 사전 응답에 합쳐진 reviewCandidate

    @Test
    void 사전_응답에_후보_표시가_합쳐진다() throws Exception {
        check(alice, "aa-01", "aa-02");
        answer(alice, "aa-01", "WRONG");
        getAs(alice, "/api/v1/topics/t1").andExpect(jsonPath("$.data.questions[?(@.slug=='aa-01')].reviewCandidate").value(true))
                .andExpect(jsonPath("$.data.questions[?(@.slug=='aa-02')].reviewCandidate").value(false))
                .andExpect(jsonPath("$.data.questions[?(@.slug=='aa-03')].reviewCandidate").value(false));
        getAs(alice, "/api/v1/questions/aa-01").andExpect(jsonPath("$.data.reviewCandidate").value(true));
        getAs(alice, "/api/v1/questions/aa-02").andExpect(jsonPath("$.data.reviewCandidate").value(false));
        getAs(alice, "/api/v1/search?q={q}", "전파").andExpect(jsonPath("$.data.hits[0].question.reviewCandidate").value(false));
        getAs(alice, "/api/v1/concepts/proxy").andExpect(jsonPath("$.data.questions[0].reviewCandidate").value(false));
    }

    @Test
    void 비로그인_응답에는_reviewCandidate_키가_없다() throws Exception {
        for (String url : new String[]{"/api/v1/topics/t1", "/api/v1/questions/aa-01", "/api/v1/concepts/proxy", "/api/v1/categories"}) {
            assertThat(bodyOf(getAs(null, url))).as(url).doesNotContain("reviewCandidate");
        }
    }

    @Test
    void 후보가_생기거나_사라지면_ETag가_바뀌고_옛_ETag는_304가_아니다() throws Exception {
        check(alice, "aa-01");
        String before = getAs(alice, "/api/v1/questions/aa-01").andReturn().getResponse().getHeader(HttpHeaders.ETAG);
        answer(alice, "aa-01", "WRONG");
        var after = mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/v1/questions/aa-01")
                .header(HttpHeaders.AUTHORIZATION, as(alice)).header(HttpHeaders.IF_NONE_MATCH, before)).andExpect(status().isOk()).andReturn().getResponse().getHeader(HttpHeaders.ETAG);
        assertThat(after).isNotEqualTo(before);
    }

    @Test
    void 사용자_상태_키만_빼면_로그인_응답은_비로그인_응답과_같다() throws Exception {
        check(alice, "aa-01");
        answer(alice, "aa-01", "WRONG");
        for (String url : new String[]{"/api/v1/topics/t1", "/api/v1/questions/aa-01", "/api/v1/concepts/proxy"}) {
            JsonNode anon = json.readTree(bodyOf(getAs(null, url)));
            JsonNode loggedIn = json.readTree(bodyOf(getAs(alice, url)));
            assertThat(loggedIn).as(url).isNotEqualTo(anon);
            assertThat(withoutLearned(loggedIn)).as(url).isEqualTo(anon);
        }
    }
}
