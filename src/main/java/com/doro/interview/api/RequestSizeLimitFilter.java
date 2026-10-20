package com.doro.interview.api;

import com.doro.interview.common.exception.ErrorCode;
import com.doro.interview.common.response.ApiResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;

/**
 * 요청 본문 크기 상한. 쓰기 본문은 작은 JSON(체크·노트 2,000자)뿐이라 넉넉한 상한을 명시해 두고, 길이를 알리는 요청은 읽기 전에
 * 413 으로 거절한다. 길이를 숨기는(chunked) 요청은 읽는 도중 상한을 넘으면 읽기를 끊어 본문 오류(400)가 된다.
 */
final class RequestSizeLimitFilter extends OncePerRequestFilter {

    private final long maxBytes;
    private final ObjectMapper json;

    RequestSizeLimitFilter(long maxBytes, ObjectMapper json) {
        this.maxBytes = maxBytes;
        this.json = json;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (request.getContentLengthLong() > maxBytes) {
            ErrorCode code = ErrorCode.PAYLOAD_TOO_LARGE;
            response.setStatus(code.httpStatus().value());
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write(json.writeValueAsString(ApiResponse.error(code.httpStatus(), code.code(), code.message())));
            return;
        }
        chain.doFilter(new LimitedRequest(request, maxBytes), response);
    }

    private static final class LimitedRequest extends HttpServletRequestWrapper {
        private final long max;

        LimitedRequest(HttpServletRequest request, long max) {
            super(request);
            this.max = max;
        }

        @Override
        public ServletInputStream getInputStream() throws IOException {
            ServletInputStream in = super.getInputStream();
            return new ServletInputStream() {
                private long read;

                private int count(int n) throws IOException {
                    if (n > 0) {
                        read += n;
                        if (read > max) {
                            throw new IOException("request body too large");
                        }
                    }
                    return n;
                }

                @Override
                public int read() throws IOException {
                    int b = in.read();
                    if (b >= 0) {
                        count(1);
                    }
                    return b;
                }

                @Override
                public int read(byte[] buf, int off, int len) throws IOException {
                    return count(in.read(buf, off, len));
                }

                @Override
                public boolean isFinished() {
                    return in.isFinished();
                }

                @Override
                public boolean isReady() {
                    return in.isReady();
                }

                @Override
                public void setReadListener(ReadListener listener) {
                    in.setReadListener(listener);
                }
            };
        }
    }
}
