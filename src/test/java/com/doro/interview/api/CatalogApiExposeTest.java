package com.doro.interview.api;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** 개발용 스위치를 켠 개발 환경: 비공개 주제도 API 로 보인다. 닫힌 질문은 여전히 404. */
@SpringBootTest(properties = {"interview.content.location=file:build/no-such-content/", "interview.catalog.expose-unpublished=true"})
@AutoConfigureMockMvc
class CatalogApiExposeTest extends AbstractApiTest {

    @Test
    void 비공개_주제와_초안_질문이_보인다() throws Exception {
        mvc.perform(get("/api/v1/topics/t2")).andExpect(status().isOk());
        mvc.perform(get("/api/v1/questions/bb-01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("DRAFT"))
                .andExpect(jsonPath("$.data.reviewedAt").doesNotExist());
        mvc.perform(get("/api/v1/categories")).andExpect(jsonPath("$.data[0].topics.length()").value(2));
        mvc.perform(get("/api/v1/concepts/hid")).andExpect(status().isOk());
    }

    @Test
    void 비공개_질문으로_가는_연결이_보인다() throws Exception {
        mvc.perform(get("/api/v1/questions/aa-02")).andExpect(jsonPath("$.data.related[0].slug").value("bb-01"));
    }

    @Test
    void 닫힌_질문은_여전히_404다() throws Exception {
        jdbc.update("update question set retired_at = now() where slug = 'bb-01'");
        mvc.perform(get("/api/v1/questions/bb-01")).andExpect(status().isNotFound());
    }
}
