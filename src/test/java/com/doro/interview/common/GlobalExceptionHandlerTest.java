package com.doro.interview.common;

import com.doro.interview.common.exception.ErrorCode;
import com.doro.interview.common.exception.GlobalExceptionHandler;
import com.doro.interview.common.exception.InterviewException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.containsString;

/** 오류가 표준 규격으로 나가는지, 내부 정보가 새지 않는지 확인한다(MockMvc standalone, DB 없음). */
class GlobalExceptionHandlerTest {

    @RestController
    static class Probe {
        @GetMapping(value = "/probe/interview", produces = MediaType.APPLICATION_JSON_VALUE)
        String interview() {
            throw new InterviewException(ErrorCode.NOT_FOUND);
        }

        @GetMapping(value = "/probe/boom", produces = MediaType.APPLICATION_JSON_VALUE)
        String boom() {
            throw new IllegalStateException("secret internal detail: select * from question where password = 'x'");
        }

        @GetMapping(value = "/probe/param", produces = MediaType.APPLICATION_JSON_VALUE)
        String param(@RequestParam int n) {
            return "ok" + n;
        }
    }

    MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(new Probe()).setControllerAdvice(new GlobalExceptionHandler()).build();
    }

    @Test
    void 업무_예외는_표준_규격과_상태코드로_나간다() throws Exception {
        mvc.perform(get("/probe/interview"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("COMMON-404-01"))
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value(ErrorCode.NOT_FOUND.message()))
                .andExpect(jsonPath("$.error.code").value("COMMON-404-01"))
                .andExpect(jsonPath("$.timestamp").exists())
                .andExpect(jsonPath("$.data").doesNotExist());
    }

    @Test
    void 예상하지_못한_예외는_500이고_내부_내용이_응답에_없다() throws Exception {
        mvc.perform(get("/probe/boom"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.code").value("SYS-500-01"))
                .andExpect(content().string(not(containsString("secret internal detail"))))
                .andExpect(content().string(not(containsString("select"))))
                .andExpect(content().string(not(containsString("IllegalStateException"))));
    }

    @Test
    void 필수_파라미터_누락과_형식_오류는_400이다() throws Exception {
        mvc.perform(get("/probe/param"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("COMMON-400-01"));
        mvc.perform(get("/probe/param").param("n", "abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("COMMON-400-01"));
    }

    @Test
    void 지원하지_않는_메서드는_405다() throws Exception {
        mvc.perform(post("/probe/param").param("n", "1"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.code").value("COMMON-405-01"));
    }

    @Test
    void 받을_수_없는_Accept는_406이다() throws Exception {
        mvc.perform(get("/probe/param").param("n", "1").accept(MediaType.APPLICATION_XML))
                .andExpect(status().isNotAcceptable())
                .andExpect(jsonPath("$.code").value("COMMON-406-01"));
    }

    @Test
    void 정상_응답은_그대로_나간다() throws Exception {
        mvc.perform(get("/probe/param").param("n", "7"))
                .andExpect(status().isOk());
    }
}
