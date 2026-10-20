package com.doro.interview.api;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;


import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** 사전 읽기 API 전체(기본 설정: 비공개 노출 꺼짐, 로그인 없음). */
@SpringBootTest(properties = {"interview.content.location=file:build/no-such-content/", "interview.catalog.expose-unpublished=false"})
@AutoConfigureMockMvc
class CatalogApiTest extends AbstractApiTest {

    // -- 목록·상세

    @Test
    void 카테고리_목록은_공개_주제만_담는다() throws Exception {
        mvc.perform(get("/api/v1/categories"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].slug").value("c1"))
                .andExpect(jsonPath("$.data[0].topics.length()").value(1))
                .andExpect(jsonPath("$.data[0].topics[0].slug").value("t1"))
                .andExpect(jsonPath("$.data[0].topics[0].counts.basic").value(1))
                .andExpect(jsonPath("$.data[0].topics[0].counts.deep").value(1))
                .andExpect(jsonPath("$.data[0].topics[0].counts.tricky").value(1));
    }

    @Test
    void 주제_상세는_질문_요약을_tier_순으로_낸다() throws Exception {
        mvc.perform(get("/api/v1/topics/t1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.summary.slug").value("t1"))
                .andExpect(jsonPath("$.data.categoryName").value("카테고리 c1"))
                .andExpect(jsonPath("$.data.sources[0].url").value("https://example.com/doc"))
                .andExpect(jsonPath("$.data.questions[*].slug", contains("aa-02", "aa-01", "aa-03")))
                .andExpect(jsonPath("$.data.questions[0].importance").value(3))
                .andExpect(jsonPath("$.data.questions[0].concepts[0]").value("proxy"));
    }

    @Test
    void 질문_상세는_답변과_상세를_나누고_연결과_개념을_담는다() throws Exception {
        mvc.perform(get("/api/v1/questions/aa-02"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.slug").value("aa-02"))
                .andExpect(jsonPath("$.data.spokenAnswer").value("기본 답변."))
                .andExpect(jsonPath("$.data.detailMd").value("(공식 문서) 근거 줄.\n(보충) 덧붙임."))
                .andExpect(jsonPath("$.data.status").value("REVIEWED"))
                .andExpect(jsonPath("$.data.importance").value(3))
                .andExpect(jsonPath("$.data.concepts[0].slug").value("proxy"))
                .andExpect(jsonPath("$.data.concepts[0].name").value("프록시"))
                .andExpect(jsonPath("$.data.followups[0].slug").value("aa-01"))
                .andExpect(jsonPath("$.data.prerequisites[0].slug").value("aa-03"))
                .andExpect(jsonPath("$.data.related.length()").value(0))      // bb-01 은 비공개라 보이지 않는다
                .andExpect(jsonPath("$.data.sources[0]").value("https://docs.example/aa-02"))
                .andExpect(jsonPath("$.data.topicSources[0].url").value("https://example.com/doc"))
                .andExpect(jsonPath("$.data.nextSlug").value("aa-01"))
                .andExpect(jsonPath("$.data.baseVersion").value("v1"));
    }

    @Test
    void 값이_없는_필드도_키는_내고_ETag용_해시는_내보내지_않는다() throws Exception {
        mvc.perform(get("/api/v1/questions/aa-01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.importance").value(org.hamcrest.Matchers.nullValue()))
                .andExpect(jsonPath("$.data.prevSlug").value("aa-02"))
                .andExpect(jsonPath("$.data.nextSlug").value("aa-03"))
                .andExpect(content().string(containsString("\"importance\":null")))
                .andExpect(content().string(not(containsString("contentHash"))))
                .andExpect(content().string(not(containsString("content_hash"))));
        mvc.perform(get("/api/v1/questions/aa-02"))
                .andExpect(jsonPath("$.data.prevSlug").value(org.hamcrest.Matchers.nullValue()));
    }

    @Test
    void 개념_목록과_상세() throws Exception {
        mvc.perform(get("/api/v1/concepts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].slug").value("proxy"))
                .andExpect(jsonPath("$.data[0].questionCount").value(1));
        mvc.perform(get("/api/v1/concepts/proxy"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.concept.name").value("프록시"))
                .andExpect(jsonPath("$.data.questions[0].slug").value("aa-02"));
    }

    // -- 검색

    @Test
    void 검색은_한국어_부분_일치로_공개_질문만_찾는다() throws Exception {
        mvc.perform(get("/api/v1/search").param("q", "전파"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.total").value(1))
                .andExpect(jsonPath("$.data.hits[0].question.slug").value("aa-02"))
                .andExpect(jsonPath("$.data.hits[0].matchedIn", contains("title", "keywords")))
                .andExpect(jsonPath("$.data.hits[0].topicName").value("주제 t1"))
                .andExpect(jsonPath("$.data.words[0]").value("전파"));
    }

    @Test
    void 검색_결과는_limit로_자르고_total은_전체_수다() throws Exception {
        mvc.perform(get("/api/v1/search").param("q", "질문").param("limit", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.hits.length()").value(2))
                .andExpect(jsonPath("$.data.total").value(3));
    }

    @Test
    void 검색어가_없거나_틀리면_400이다() throws Exception {
        mvc.perform(get("/api/v1/search")).andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("COMMON-400-01"));
        mvc.perform(get("/api/v1/search").param("q", "   ")).andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("SEARCH-400-01"));
        mvc.perform(get("/api/v1/search").param("q", "a b c d e f")).andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("SEARCH-400-01"));
        mvc.perform(get("/api/v1/search").param("q", "가".repeat(101))).andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("SEARCH-400-01"));
        mvc.perform(get("/api/v1/search").param("q", "a").param("limit", "0")).andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("SEARCH-400-01"));
        mvc.perform(get("/api/v1/search").param("q", "a").param("limit", "101")).andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("SEARCH-400-01"));
        mvc.perform(get("/api/v1/search").param("q", "a").param("limit", "abc")).andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("COMMON-400-01"));
    }

    @Test
    void 인젝션_문자열은_200_빈_결과다() throws Exception {
        mvc.perform(get("/api/v1/search").param("q", "'; drop table question; --"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.hits.length()").value(0));
        assertThat(jdbc.queryForObject("select count(*) from question", Integer.class)).isEqualTo(4);
    }

    // -- 보이지 않는 것은 모두 똑같은 404

    private String notFoundSignature(String path) throws Exception {
        MvcResult r = mvc.perform(get(path)).andReturn();
        assertThat(r.getResponse().getStatus()).as(path).isEqualTo(404);
        assertThat(r.getResponse().getContentType()).as(path).startsWith("application/json");
        String body = r.getResponse().getContentAsString();
        // timestamp 만 다르므로 나머지 필드를 뽑아 비교한다
        return body.replaceAll("\"timestamp\":\"[^\"]*\"", "");
    }

    @Test
    void 비공개_없는_닫힌_잘못된_주소는_본문까지_똑같은_404다() throws Exception {
        jdbc.update("update question set retired_at = now() where slug = 'aa-03'");
        String expected = notFoundSignature("/api/v1/questions/no-such-question");
        assertThat(notFoundSignature("/api/v1/questions/bb-01")).isEqualTo(expected);   // 비공개 주제의 질문
        assertThat(notFoundSignature("/api/v1/questions/aa-03")).isEqualTo(expected);   // 닫힌 질문
        assertThat(notFoundSignature("/api/v1/questions/UPPER")).isEqualTo(expected);   // 형식이 틀린 slug
        assertThat(notFoundSignature("/api/v1/questions/" + "a".repeat(61))).isEqualTo(expected);
        assertThat(notFoundSignature("/api/v1/topics/t2")).isEqualTo(expected);          // 비공개 주제
        assertThat(notFoundSignature("/api/v1/topics/no-such-topic")).isEqualTo(expected);
        assertThat(notFoundSignature("/api/v1/concepts/hid")).isEqualTo(expected);       // 비공개 질문에만 붙은 개념
        assertThat(notFoundSignature("/api/v1/concepts/no-such-concept")).isEqualTo(expected);
        assertThat(notFoundSignature("/api/v1/no-such-endpoint")).isEqualTo(expected);   // 없는 주소
        assertThat(expected).contains("COMMON-404-01");
    }

    @Test
    void 비공개로_돌리면_공개했던_것도_바로_404다() throws Exception {
        mvc.perform(get("/api/v1/questions/aa-01")).andExpect(status().isOk());
        jdbc.update("update topic set published = false where slug = 't1'");
        mvc.perform(get("/api/v1/questions/aa-01")).andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/topics/t1")).andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/categories")).andExpect(jsonPath("$.data.length()").value(0));
        mvc.perform(get("/api/v1/search").param("q", "질문")).andExpect(jsonPath("$.data.total").value(0));
    }

    // -- 인증·메서드·형식

    @Test
    void 로그인_없이_호출되고_인증_헤더는_무시된다() throws Exception {
        mvc.perform(get("/api/v1/categories")).andExpect(status().isOk());
        mvc.perform(get("/api/v1/categories").header(HttpHeaders.AUTHORIZATION, "Bearer not-a-token")).andExpect(status().isOk());
    }

    @Test
    void 읽기_전용이다_쓰기_메서드는_405다() throws Exception {
        mvc.perform(post("/api/v1/categories")).andExpect(status().isMethodNotAllowed()).andExpect(jsonPath("$.code").value("COMMON-405-01"));
    }

    @Test
    void 받을_수_없는_Accept도_JSON_오류로_답한다() throws Exception {
        mvc.perform(get("/api/v1/categories").accept(MediaType.APPLICATION_XML))
                .andExpect(status().isNotAcceptable())
                .andExpect(jsonPath("$.code").value("COMMON-406-01"));
    }

    // -- 캐시

    @Test
    void 항상_재검증하도록_no_cache이고_ETag가_붙는다() throws Exception {
        mvc.perform(get("/api/v1/questions/aa-02"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-cache"))
                .andExpect(header().exists(HttpHeaders.ETAG));
    }

    @Test
    void 바뀌지_않았으면_304이고_바뀌면_새_본문과_다른_ETag를_준다() throws Exception {
        String etag = mvc.perform(get("/api/v1/questions/aa-02")).andReturn().getResponse().getHeader(HttpHeaders.ETAG);
        assertThat(etag).isNotBlank();
        mvc.perform(get("/api/v1/questions/aa-02").header(HttpHeaders.IF_NONE_MATCH, etag))
                .andExpect(status().isNotModified())
                .andExpect(content().string(""));
        // 해시에 들어가지 않는 메타데이터(출처)만 바뀌어도 응답이 달라지므로 ETag 도 달라진다
        jdbc.update("update question set sources = '[\"https://changed.example\"]'::jsonb where slug = 'aa-02'");
        MvcResult changed = mvc.perform(get("/api/v1/questions/aa-02").header(HttpHeaders.IF_NONE_MATCH, etag))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.sources[0]").value("https://changed.example"))
                .andReturn();
        assertThat(changed.getResponse().getHeader(HttpHeaders.ETAG)).isNotEqualTo(etag);
    }

    @Test
    void 오류_응답에는_ETag가_붙지_않는다() throws Exception {
        MvcResult r = mvc.perform(get("/api/v1/questions/nope")).andReturn();
        assertThat(r.getResponse().getHeader(HttpHeaders.ETAG)).isNull();
    }
}
