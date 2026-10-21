package com.doro.interview.api;

import org.junit.jupiter.api.Test;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** 공개 설정 API: 측정 ID 가 없으면(기본) 비어 있고, 로그인 없이 열리며 공용 캐시(ETag)다. */
@SpringBootTest(properties = {"interview.content.location=file:build/no-such-content/"})
@AutoConfigureMockMvc
class ConfigApiTest extends AbstractApiTest {

    @Test
    void 측정_ID_가_없으면_null_이다() throws Exception {
        mvc.perform(get("/api/v1/config")).andExpect(status().isOk()).andExpect(jsonPath("$.data.analyticsId").value((Object) null))
                .andExpect(header().exists(HttpHeaders.ETAG));
    }
}
