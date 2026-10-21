package com.doro.interview.api;

import org.junit.jupiter.api.Test;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** 올바른 형식의 측정 ID 는 그대로 나간다. */
@SpringBootTest(properties = {"interview.content.location=file:build/no-such-content/", "interview.analytics.ga-measurement-id= G-ABC123XYZ9 "})
@AutoConfigureMockMvc
class ConfigApiEnabledTest extends AbstractApiTest {

    @Test
    void 올바른_측정_ID_는_공백을_정리해_돌려준다() throws Exception {
        mvc.perform(get("/api/v1/config")).andExpect(status().isOk()).andExpect(jsonPath("$.data.analyticsId").value("G-ABC123XYZ9"));
    }
}
