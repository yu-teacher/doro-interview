package com.doro.interview.api;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** 자주 나오는 질문 API: 로그인 없이 열리고, 공용 캐시(ETag)이며 사용자 상태가 없다. */
class FeaturedApiTest extends AbstractProgressApiTest {

    @Test
    void 로그인_없이_열리고_필수도_3인_보이는_질문을_준다() throws Exception {
        jdbc.update("update question set importance = 3 where slug in ('aa-01', 'aa-02', 'bb-01')");
        getAs(null, "/api/v1/questions/featured").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].slug").value("aa-02"))
                .andExpect(jsonPath("$.data[0].topicName").exists())
                .andExpect(header().exists(HttpHeaders.ETAG));
    }

    @Test
    void 사용자_상태는_섞이지_않아_로그인해도_본문이_같다() throws Exception {
        jdbc.update("update question set importance = 3 where slug = 'aa-02'");
        putAs(alice, "/api/v1/progress/aa-02", "{\"learned\":true}").andExpect(status().isOk());
        String anon = bodyOf(getAs(null, "/api/v1/questions/featured"));
        String logged = bodyOf(getAs(alice, "/api/v1/questions/featured"));
        assertThat(json.readTree(logged).at("/data")).isEqualTo(json.readTree(anon).at("/data"));
        assertThat(logged).doesNotContain("learned");
    }

    @Test
    void 슬러그_질문_상세_경로와_겹치지_않는다() throws Exception {
        getAs(null, "/api/v1/questions/aa-01").andExpect(status().isOk()).andExpect(jsonPath("$.data.slug").value("aa-01"));
        getAs(null, "/api/v1/questions/featured").andExpect(status().isOk()).andExpect(jsonPath("$.data.length()").value(0));
    }
}
