package com.doro.interview.api;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** 길이를 알리지 않는(chunked) 요청도 읽는 도중 상한을 넘으면 읽기가 끊긴다. */
class RequestSizeLimitFilterTest {

    private static MockHttpServletRequest chunked(byte[] body) {
        MockHttpServletRequest request = new MockHttpServletRequest("PUT", "/api/v1/notes/aa-01") {
            @Override
            public long getContentLengthLong() {
                return -1; // Content-Length 없음
            }
        };
        request.setContent(body);
        return request;
    }

    private static byte[] readAll(HttpServletRequest request) throws IOException {
        return request.getInputStream().readAllBytes();
    }

    @Test
    void 상한_이하는_그대로_읽힌다() throws Exception {
        var filter = new RequestSizeLimitFilter(100, JsonMapper.builder().build());
        var chain = new MockFilterChain();
        byte[][] read = new byte[1][];
        filter.doFilter(chunked(new byte[100]), new MockHttpServletResponse(), new MockFilterChain(new jakarta.servlet.http.HttpServlet() {
            @Override
            protected void service(HttpServletRequest req, jakarta.servlet.http.HttpServletResponse res) throws IOException {
                read[0] = readAll(req);
            }
        }));
        assertThat(read[0]).hasSize(100);
    }

    @Test
    void 상한을_넘으면_읽다가_끊긴다() {
        var filter = new RequestSizeLimitFilter(100, JsonMapper.builder().build());
        assertThatThrownBy(() -> filter.doFilter(chunked(new byte[101]), new MockHttpServletResponse(), new MockFilterChain(new jakarta.servlet.http.HttpServlet() {
            @Override
            protected void service(HttpServletRequest req, jakarta.servlet.http.HttpServletResponse res) throws IOException {
                readAll(req);
            }
        }))).isInstanceOf(IOException.class).hasMessageContaining("too large");
    }

    @Test
    void 길이가_상한을_넘는다고_알리면_읽기_전에_413이다() throws Exception {
        var filter = new RequestSizeLimitFilter(100, JsonMapper.builder().build());
        var request = new MockHttpServletRequest("PUT", "/api/v1/notes/aa-01");
        request.setContent(new byte[101]);
        var response = new MockHttpServletResponse();
        boolean[] reached = {false};
        filter.doFilter(request, response, new MockFilterChain(new jakarta.servlet.http.HttpServlet() {
            @Override
            protected void service(HttpServletRequest req, jakarta.servlet.http.HttpServletResponse res) {
                reached[0] = true;
            }
        }));
        assertThat(response.getStatus()).isEqualTo(413);
        assertThat(reached[0]).isFalse();
        assertThat(response.getContentAsString()).contains("COMMON-413-01");
    }
}
