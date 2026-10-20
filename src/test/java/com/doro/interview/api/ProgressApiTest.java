package com.doro.interview.api;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** 학습 체크 API: 인증, 입력 검증, 멱등성, 404, 요약. */
class ProgressApiTest extends AbstractProgressApiTest {

    private int rows() {
        return jdbc.queryForObject("select count(*) from user_progress", Integer.class);
    }

    // -- 인증

    @Test
    void 비로그인은_모든_진도_API가_401이고_아무것도_저장되지_않는다() throws Exception {
        putAs(null, "/api/v1/progress/aa-01", "{\"learned\":true}").andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false)).andExpect(jsonPath("$.code").value("AUTH-401-01"));
        putAs(null, "/api/v1/progress", "{\"topic\":\"t1\",\"learned\":true,\"expectedCount\":3}").andExpect(status().isUnauthorized());
        getAs(null, "/api/v1/progress/summary").andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("AUTH-401-01"));
        assertThat(rows()).isZero();
        assertThat(userRows()).isZero();
    }

    @Test
    void 비로그인이면_본문이_엉망이어도_400이_아니라_401이다() throws Exception {
        putAs(null, "/api/v1/progress/aa-01", "{\"learned\":\"x\"}").andExpect(status().isUnauthorized());
        putAs(null, "/api/v1/progress/no-such", "{}").andExpect(status().isUnauthorized());
    }

    @Test
    void 만료된_토큰도_401이다() throws Exception {
        mvc.perform(put("/api/v1/progress/aa-01").contentType(MediaType.APPLICATION_JSON).content("{\"learned\":true}")
                .header(HttpHeaders.AUTHORIZATION, bearer(DORO.expired(alice)))).andExpect(status().isUnauthorized());
    }

    // -- 질문 하나

    @Test
    void 체크와_해제는_멱등이고_응답은_저장하지_않는다() throws Exception {
        for (int i = 0; i < 2; i++) {
            putAs(alice, "/api/v1/progress/aa-01", "{\"learned\":true}").andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true)).andExpect(jsonPath("$.data.slug").value("aa-01"))
                    .andExpect(jsonPath("$.data.learned").value(true)).andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store"));
        }
        assertThat(rows()).isEqualTo(1);
        for (int i = 0; i < 2; i++) {
            putAs(alice, "/api/v1/progress/aa-01", "{\"learned\":false}").andExpect(status().isOk()).andExpect(jsonPath("$.data.learned").value(false));
        }
        assertThat(rows()).isZero();
        assertThat(userRows()).isEqualTo(1); // 사용자 행은 첫 쓰기에서 생긴다
    }

    @Test
    void 체크는_토큰의_사용자에게_저장된다() throws Exception {
        putAs(alice, "/api/v1/progress/aa-01", "{\"learned\":true}");
        assertThat(jdbc.queryForObject("select user_id from user_progress", java.util.UUID.class)).isEqualTo(alice);
    }

    @Test
    void 잘못된_본문은_400이고_아무것도_저장되지_않는다() throws Exception {
        String[] bad = {
                "{}", "{\"learned\":null}", "{\"learned\":\"true\"}", "{\"learned\":\"false\"}", "{\"learned\":1}", "{\"learned\":0}",
                "{\"learned\":[true]}", "{\"learned\":true,\"userId\":\"" + bob + "\"}", "{\"learned\":true,\"extra\":1}", "[true]", "true", "{not json"
        };
        for (String body : bad) {
            putAs(alice, "/api/v1/progress/aa-01", body).andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("COMMON-400-01"));
        }
        assertThat(rows()).isZero();
    }

    @Test
    void 본문이_없거나_JSON이_아니면_400_415다() throws Exception {
        mvc.perform(put("/api/v1/progress/aa-01").header(HttpHeaders.AUTHORIZATION, as(alice)).contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
        mvc.perform(put("/api/v1/progress/aa-01").header(HttpHeaders.AUTHORIZATION, as(alice)).contentType(MediaType.TEXT_PLAIN).content("learned=true"))
                .andExpect(status().isUnsupportedMediaType()).andExpect(jsonPath("$.code").value("COMMON-415-01"));
        assertThat(rows()).isZero();
    }

    @Test
    void 오류_본문에_내부_파싱_메시지가_없다() throws Exception {
        var body = bodyOf(putAs(alice, "/api/v1/progress/aa-01", "{not json"));
        assertThat(body).doesNotContain("Unexpected", "Jackson", "JsonParse", "line:");
    }

    @Test
    void 보이지_않는_질문은_사전_API와_같은_404다() throws Exception {
        var expected = errorShape(bodyOf(getAs(null, "/api/v1/questions/zz-99").andExpect(status().isNotFound())));
        for (String slug : new String[]{"bb-01", "zz-99", "ZZ_99", "-a", "a".repeat(61)}) {
            var r = putAs(alice, "/api/v1/progress/" + slug, "{\"learned\":true}").andExpect(status().isNotFound());
            assertThat(errorShape(bodyOf(r))).isEqualTo(expected);
        }
        assertThat(rows()).isZero();
    }

    @Test
    void 닫힌_질문도_404다() throws Exception {
        fx.delete("c1", "t1", "aa-03");
        loader.load(fx.location());
        putAs(alice, "/api/v1/progress/aa-03", "{\"learned\":true}").andExpect(status().isNotFound());
        assertThat(rows()).isZero();
    }

    // -- 주제 일괄

    @Test
    void 주제_일괄_체크와_해제() throws Exception {
        putAs(alice, "/api/v1/progress", "{\"topic\":\"t1\",\"learned\":true,\"expectedCount\":3}").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.topic").value("t1")).andExpect(jsonPath("$.data.learned").value(true))
                .andExpect(jsonPath("$.data.count").value(3)).andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store"));
        assertThat(rows()).isEqualTo(3);
        putAs(alice, "/api/v1/progress", "{\"topic\":\"t1\",\"learned\":false,\"expectedCount\":3}").andExpect(status().isOk());
        assertThat(rows()).isZero();
    }

    @Test
    void 개수가_다르면_409다() throws Exception {
        putAs(alice, "/api/v1/progress", "{\"topic\":\"t1\",\"learned\":true,\"expectedCount\":4}").andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("PROGRESS-409-01")).andExpect(jsonPath("$.success").value(false));
        assertThat(rows()).isZero();
    }

    @Test
    void 비공개_주제와_없는_주제는_404다() throws Exception {
        for (String topic : new String[]{"t2", "zz", "Bad_Slug"}) {
            putAs(alice, "/api/v1/progress", "{\"topic\":\"" + topic + "\",\"learned\":true,\"expectedCount\":1}").andExpect(status().isNotFound());
        }
        assertThat(rows()).isZero();
    }

    @Test
    void 주제_일괄의_잘못된_입력은_400이다() throws Exception {
        String[] bad = {
                "{}", "{\"topic\":\"t1\",\"learned\":true}", "{\"topic\":\"t1\",\"expectedCount\":3}", "{\"learned\":true,\"expectedCount\":3}",
                "{\"topic\":\"t1\",\"learned\":\"true\",\"expectedCount\":3}", "{\"topic\":\"t1\",\"learned\":true,\"expectedCount\":\"3\"}",
                "{\"topic\":\"t1\",\"learned\":true,\"expectedCount\":-1}", "{\"topic\":\"t1\",\"learned\":true,\"expectedCount\":3.0}",
                "{\"topic\":\"t1\",\"learned\":true,\"expectedCount\":3.5}", "{\"topic\":1,\"learned\":true,\"expectedCount\":3}",
                "{\"topic\":\"t1\",\"learned\":true,\"expectedCount\":3,\"userId\":\"" + bob + "\"}"
        };
        for (String body : bad) {
            putAs(alice, "/api/v1/progress", body).andExpect(status().isBadRequest());
        }
        assertThat(rows()).isZero();
    }

    // -- 요약

    @Test
    void 요약은_보이는_질문_기준이고_사용자별이다() throws Exception {
        putAs(alice, "/api/v1/progress/aa-01", "{\"learned\":true}");
        putAs(alice, "/api/v1/progress/aa-02", "{\"learned\":true}");
        putAs(bob, "/api/v1/progress/aa-03", "{\"learned\":true}");
        getAs(alice, "/api/v1/progress/summary").andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store"))
                .andExpect(jsonPath("$.data.total").value(3)).andExpect(jsonPath("$.data.learned").value(2))
                .andExpect(jsonPath("$.data.topics.length()").value(1)).andExpect(jsonPath("$.data.topics[0].topicSlug").value("t1"))
                .andExpect(jsonPath("$.data.topics[0].total").value(3)).andExpect(jsonPath("$.data.topics[0].learned").value(2));
        getAs(bob, "/api/v1/progress/summary").andExpect(jsonPath("$.data.learned").value(1));
        getAs(bob, "/api/v1/progress/summary").andExpect(header().doesNotExist(HttpHeaders.ETAG));
    }

    @Test
    void 응답에_다른_사용자_정보가_없다() throws Exception {
        putAs(alice, "/api/v1/progress/aa-01", "{\"learned\":true}");
        var body = bodyOf(getAs(alice, "/api/v1/progress/summary"));
        assertThat(body).doesNotContain(alice.toString()).doesNotContain("user@example.test");
        putAs(alice, "/api/v1/progress/aa-01", "{\"learned\":true}").andExpect(jsonPath("$.data").exists())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().string(org.hamcrest.Matchers.not(containsString(alice.toString()))));
    }
}
