package com.doro.interview.api;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import tools.jackson.databind.JsonNode;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** 사전 응답에 `learned` 를 합치는 규칙(docs/M2-PLAN.md D8): 로그인한 사용자에게만, 그 외에는 M1 과 바이트가 같다. */
class LearnedMergeTest extends AbstractProgressApiTest {

    private static final List<String> URLS = List.of("/api/v1/topics/t1", "/api/v1/questions/aa-02", "/api/v1/search?q={q}", "/api/v1/concepts/proxy");

    private void check(java.util.UUID user, String slug) throws Exception {
        putAs(user, "/api/v1/progress/" + slug, "{\"learned\":true}").andExpect(status().isOk());
    }

    // -- 비로그인: M1 과 같다

    @Test
    void 비로그인_응답에는_learned_키가_어디에도_없다() throws Exception {
        for (String url : URLS) {
            String body = bodyOf(getAs(null, url, "전파").andExpect(status().isOk()));
            assertThat(body).as(url).doesNotContain("learned");
        }
        assertThat(bodyOf(getAs(null, "/api/v1/categories"))).doesNotContain("learned");
    }

    @Test
    void 비로그인_응답은_읽기_모델을_그대로_직렬화한_것과_같다() throws Exception {
        // DTO 가 읽기 모델(M1 응답)과 필드 이름·순서·값이 같다는 보장: learned 를 더하는 것 외에 아무것도 바꾸지 않았다
        var reader = loaderBackedReader();
        assertThat(bodyOf(getAs(null, "/api/v1/topics/t1")))
                .isEqualTo(json.writeValueAsString(com.doro.interview.common.response.ApiResponse.cacheable(reader.topic("t1").orElseThrow())));
        assertThat(bodyOf(getAs(null, "/api/v1/concepts/proxy")))
                .isEqualTo(json.writeValueAsString(com.doro.interview.common.response.ApiResponse.cacheable(reader.concept("proxy").orElseThrow())));
        assertThat(bodyOf(getAs(null, "/api/v1/search?q={q}", "전파")))
                .isEqualTo(json.writeValueAsString(com.doro.interview.common.response.ApiResponse.cacheable(
                        reader.search(com.doro.interview.catalog.SearchQuery.parse("전파", null)))));
    }

    @org.springframework.beans.factory.annotation.Autowired
    com.doro.interview.catalog.CatalogReader catalogReader;

    private com.doro.interview.catalog.CatalogReader loaderBackedReader() {
        return catalogReader;
    }

    @Test
    void 비로그인_응답의_Cache_Control은_M1과_같다() throws Exception {
        for (String url : URLS) {
            getAs(null, url, "전파").andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-cache")).andExpect(header().exists(HttpHeaders.ETAG));
        }
    }

    @Test
    void 쿠키만_있거나_잘못된_토큰이면_비로그인_응답이다() throws Exception {
        for (String url : URLS) {
            mvc.perform(get(url, "전파").header(HttpHeaders.AUTHORIZATION, bearer(DORO.forged(alice)))).andExpect(status().isOk())
                    .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-cache"));
            assertThat(bodyOf(mvc.perform(get(url, "전파").header(HttpHeaders.AUTHORIZATION, bearer(DORO.expired(alice)))))).doesNotContain("learned");
        }
    }

    @Test
    void 탈퇴한_사용자는_learned를_받지_못한다() throws Exception {
        check(alice, "aa-01");
        jdbc.update("update interview_user set deleted_at = now() where user_id = ?", alice);
        assertThat(bodyOf(getAs(alice, "/api/v1/topics/t1"))).doesNotContain("learned");
    }

    // -- 로그인: 합쳐진다

    @Test
    void 주제의_질문_목록에_질문마다_learned가_붙는다() throws Exception {
        check(alice, "aa-02");
        getAs(alice, "/api/v1/topics/t1").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.questions[?(@.slug=='aa-02')].learned").value(true))
                .andExpect(jsonPath("$.data.questions[?(@.slug=='aa-01')].learned").value(false))
                .andExpect(jsonPath("$.data.questions[?(@.slug=='aa-03')].learned").value(false));
    }

    @Test
    void 질문_상세에_learned가_붙는다() throws Exception {
        getAs(alice, "/api/v1/questions/aa-02").andExpect(jsonPath("$.data.learned").value(false));
        check(alice, "aa-02");
        getAs(alice, "/api/v1/questions/aa-02").andExpect(jsonPath("$.data.learned").value(true));
    }

    @Test
    void 검색_결과와_개념_상세에_learned가_붙는다() throws Exception {
        check(alice, "aa-02");
        getAs(alice, "/api/v1/search?q={q}", "전파").andExpect(jsonPath("$.data.hits[0].question.slug").value("aa-02"))
                .andExpect(jsonPath("$.data.hits[0].question.learned").value(true));
        getAs(alice, "/api/v1/concepts/proxy").andExpect(jsonPath("$.data.questions[0].learned").value(true));
        getAs(bob, "/api/v1/concepts/proxy").andExpect(jsonPath("$.data.questions[0].learned").value(false));
    }

    @Test
    void 사용자마다_같은_주소에서_다른_본문을_받는다() throws Exception {
        check(alice, "aa-01");
        String a = bodyOf(getAs(alice, "/api/v1/topics/t1"));
        String b = bodyOf(getAs(bob, "/api/v1/topics/t1"));
        assertThat(a).isNotEqualTo(b);
    }

    @Test
    void 로그인_응답에서_learned만_빼면_비로그인_응답과_같다() throws Exception {
        check(alice, "aa-02");
        for (String url : URLS) {
            JsonNode anon = json.readTree(bodyOf(getAs(null, url, "전파")));
            JsonNode loggedIn = json.readTree(bodyOf(getAs(alice, url, "전파")));
            assertThat(loggedIn).as(url).isNotEqualTo(anon);
            assertThat(withoutLearned(loggedIn)).as(url).isEqualTo(anon);
        }
    }

    @Test
    void 보이지_않는_질문의_체크는_응답에_나타나지_않는다() throws Exception {
        // 옛 기록이 남아 있어도(닫힌 질문) 보이는 응답에는 영향이 없다
        jdbc.update("insert into user_progress (user_id, question_slug) values (?, 'bb-01')", alice);
        getAs(alice, "/api/v1/topics/t1").andExpect(jsonPath("$.data.questions.length()").value(3));
        getAs(alice, "/api/v1/questions/bb-01").andExpect(status().isNotFound());
    }

    @Test
    void 로그인_응답은_private_no_cache이고_로그인_상태_조회는_행을_만들지_않는다() throws Exception {
        getAs(alice, "/api/v1/topics/t1").andExpect(header().string(HttpHeaders.CACHE_CONTROL, "private, no-cache"));
        assertThat(userRows()).isZero();
    }

    // -- ETag: 합쳐진 본문이 곧 사용자별 ETag

    @Test
    void 체크하면_ETag가_바뀌고_이전_ETag로는_304가_아니라_200이다() throws Exception {
        for (String url : List.of("/api/v1/topics/t1", "/api/v1/questions/aa-02")) {
            String before = getAs(alice, url, "전파").andReturn().getResponse().getHeader(HttpHeaders.ETAG);
            assertThat(before).isNotNull();
            getAs(alice, url, "전파").andExpect(status().isOk()); // 같은 상태
            mvc.perform(get(url).header(HttpHeaders.AUTHORIZATION, as(alice)).header(HttpHeaders.IF_NONE_MATCH, before)).andExpect(status().isNotModified());

            putAs(alice, "/api/v1/progress/aa-02", "{\"learned\":" + (url.contains("questions") ? "true" : "true") + "}");
            var after = mvc.perform(get(url).header(HttpHeaders.AUTHORIZATION, as(alice)).header(HttpHeaders.IF_NONE_MATCH, before))
                    .andExpect(status().isOk()).andReturn().getResponse().getHeader(HttpHeaders.ETAG);
            assertThat(after).isNotEqualTo(before);
            mvc.perform(get(url).header(HttpHeaders.AUTHORIZATION, as(alice)).header(HttpHeaders.IF_NONE_MATCH, after)).andExpect(status().isNotModified());
            putAs(alice, "/api/v1/progress/aa-02", "{\"learned\":false}"); // 다음 반복을 위해 되돌림
        }
    }

    @Test
    void 사용자별로_ETag가_다르고_남의_ETag로는_304가_아니다() throws Exception {
        check(alice, "aa-01");
        String a = getAs(alice, "/api/v1/topics/t1").andReturn().getResponse().getHeader(HttpHeaders.ETAG);
        String b = getAs(bob, "/api/v1/topics/t1").andReturn().getResponse().getHeader(HttpHeaders.ETAG);
        String anon = getAs(null, "/api/v1/topics/t1").andReturn().getResponse().getHeader(HttpHeaders.ETAG);
        assertThat(java.util.Set.of(a, b, anon)).hasSize(3);
        mvc.perform(get("/api/v1/topics/t1").header(HttpHeaders.AUTHORIZATION, as(bob)).header(HttpHeaders.IF_NONE_MATCH, a)).andExpect(status().isOk());
    }

    @Test
    void 로그아웃_상태가_로그인_상태의_ETag로_304를_받지_못한다() throws Exception {
        String loggedIn = getAs(alice, "/api/v1/topics/t1").andReturn().getResponse().getHeader(HttpHeaders.ETAG);
        mvc.perform(get("/api/v1/topics/t1").header(HttpHeaders.IF_NONE_MATCH, loggedIn)).andExpect(status().isOk());
    }
}
